import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { CosmosClient } from '@azure/cosmos';
import fetch from 'isomorphic-fetch';
import { IncomingWatch } from "./incoming-watch.js";
import { Request } from "../SharedCode/request.js";
import { marketPlaces } from "../SharedCode/marketplaces.enum.js";
import { generateResponse } from "../SharedCode/http-helpers/response-generator.js";
import { ResponseCodes } from "../SharedCode/http-helpers/response-codes.enum.js";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const contract = req.body;

    // Be sure the verification code is a number, as it is injected into SQL
    if (!isValidContract(contract)) {
        context.bindings.httpRes = generateResponse(ResponseCodes.InvalidContract);
        return;
    }
    const watch = sanitizeContract(contract);

    // Verify captcha was completed
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env["CaptchaSecret"]}&response=${watch.captchaToken}`,
      });
    const verification = await response.json();
    if (!verification.success) {
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
        context.bindings.httpRes = generateResponse(ResponseCodes.InvalidVerificationCode);
        return;
    }

    const duplicateWatchQuery = await cosmosClient
        .container('requests')
        .items
        .query(`SELECT * FROM requests AS r WHERE r.query = '${watch.query}' AND r.contact = '${watch.contact}'`)
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
        ttl: 24 * 60 * 60 * watch.dayCount
    } as Request));
    context.bindings.requests = JSON.stringify(requests);
    context.bindings.httpRes = generateResponse(ResponseCodes.Success);
}

export default httpTrigger;

function isValidContract(contract: unknown): contract is IncomingWatch {
    return (
        contract 
        && typeof contract['verificationCode'] === 'number'
        && typeof contract['contact'] === 'string'
        && contract['contact'].length < 30
        && !/[\s'"]/.test(contract['contact'])
        && /^\S+@\S+\.\S+$/.test(contract['contact'])
        && typeof contract['query'] === 'string'
        && Array.isArray(contract['marketplaceIds'])
        && contract['marketplaceIds'].every(id => marketPlaces.has(id))
    );
}

function sanitizeContract(contract: IncomingWatch): IncomingWatch {
    contract.query = contract.query.replace(/'/g, "\\'");
    contract.contact = contract.contact.replace(/'/g, "\\'");
    return contract;
}
