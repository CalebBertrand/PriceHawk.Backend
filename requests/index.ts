import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { CosmosClient } from '@azure/cosmos';
import fetch from 'isomorphic-fetch';
import { IncomingWatch } from "./incoming-watch.js";
import { Request } from "../SharedCode/request.js";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const watch = req.body;

    // Be sure the verification code is a number, as it is injected into SQL
    if (!isValidContract(watch)) {
        context.bindings.httpRes = { status: 400, body: "Invalid Request" };
        return;
    }

    // Verify captcha was completed
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env["CaptchaSecret"]}&response=${watch.captchaToken}`,
      });
    const verification = await response.json();
    if (!verification.success) {
        context.bindings.httpRes = { status: 403, body: "Captcha Failed" };
        return;
    }

    const cosmosClient = new CosmosClient(process.env["PriceHawkConnectionString"])
        .database('price-hawk').container('verifications');
    const { resources } = await cosmosClient.items
        .query(`SELECT * FROM verifications AS v WHERE v.code = ${watch.verificationCode} AND v.email = '${watch.contact}'`)
        .fetchNext();
    if (!resources.length) {
        context.bindings.httpRes = { status: 403, body: "Verification Code Incorrect" };
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
    context.bindings.httpRes = { status: 200, body: "Success" };
}

export default httpTrigger;

function isValidContract(contract: unknown): contract is IncomingWatch {
    return (
        contract 
        && typeof contract['verificationCode'] === 'number'
        && contract['contact']
        && contract['contact'].length < 30
        && !/[\s'"]/.test(contract['contact'])
        && /^\S+@\S+\.\S+$/.test(contract['contact'])
    );
}
