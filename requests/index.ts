import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { CosmosClient } from '@azure/cosmos';
import fetch from 'isomorphic-fetch';
import { Request } from "../SharedCode/request.js";
import { generateResponse } from "../SharedCode/http-helpers/response-generator.js";
import { ResponseCodes } from "../SharedCode/http-helpers/response-codes.enum.js";
import appInsights from 'applicationinsights';
import { sanitizeWatch } from "../SharedCode/utils/sanitation.js";
import { isValidWatch } from '../SharedCode/utils/validation.js';

appInsights.setup(process.env['APPLICATIONINSIGHTS_CONNECTION_STRING']).start();

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const watch = req.body;

    if (!isValidWatch(watch)) {
        appInsights.defaultClient.trackEvent({ name: `Invalid Contract: ${JSON.stringify(watch)}` });
        context.bindings.httpRes = generateResponse(ResponseCodes.InvalidContract);
        return;
    }
    sanitizeWatch(watch);

    // Verify captcha was completed
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env["CaptchaSecret"]}&response=${watch.captchaToken}`,
      });
    const verification = await response.json();
    if (!verification.success) {
        appInsights.defaultClient.trackEvent({ name: `Captcha Failed: ${JSON.stringify(verification)}` });
        context.bindings.httpRes = generateResponse(ResponseCodes.CaptchaFailed);
        return;
    }

    const cosmosClient = new CosmosClient(process.env["PriceHawkConnectionString"]).database('price-hawk');

    const matchingVerificationQuery = await cosmosClient
        .container('verifications')
        .items
        .query(`SELECT * FROM verifications AS v WHERE v.code = ${watch.verificationCode} AND v.email = '${watch.contact}'`)
        .fetchNext();
    if (!matchingVerificationQuery.resources.length) {
        appInsights.defaultClient.trackEvent({
            name: `No Verification Code Matching ${watch.verificationCode}`,
            measurements: { code: watch.verificationCode }
        });
        context.bindings.httpRes = generateResponse(ResponseCodes.InvalidVerificationCode);
        return;
    }

    const normalizedQuery = watch.query.trim().toLowerCase();
    const duplicateWatchQuery = await cosmosClient.container('requests')
        .items
        .query(`SELECT * FROM requests AS r WHERE r.query = '${normalizedQuery}' AND r.contact = '${watch.contact}'`)
        .fetchNext();
    if (duplicateWatchQuery.resources.length) {
        context.bindings.httpRes = generateResponse(ResponseCodes.DuplicateWatch);
        return;
    }

    // Insert the requests into the db
    const requests = watch.marketplaceIds.map(marketplaceId => ({
        contact: watch.contact,
        marketplaceId,
        query: watch.query,
        price: watch.price,
        ttl: 24 * 60 * 60 * watch.dayCount,
        mustInclude: watch.mustInclude
    } as Request));
    context.bindings.requests = JSON.stringify(requests);
    context.bindings.httpRes = generateResponse(ResponseCodes.Success);
}

// App insights wrapper
export default async function contextPropagatingHttpTrigger(context: Context, req: HttpRequest) {
    const correlationContext = appInsights.startOperation(context, req);

    return appInsights.wrapWithCorrelationContext(async () => {
        const startTime = Date.now();

        const result = await httpTrigger(context, req);

        appInsights.defaultClient.trackRequest({
            name: context.req.method + " " + context.req.url,
            resultCode: context.res.status,
            success: true,
            url: req.url,
            time: new Date(startTime),
            duration: Date.now() - startTime,
            id: correlationContext.operation.parentId,
        });
        appInsights.defaultClient.flush();

        return result;
    }, correlationContext)();
};
