import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import 'isomorphic-fetch';
import { IncomingWatch } from "./incoming-watch.js";
import { Request } from "../SharedCode/request.js";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const watch = JSON.parse(req.body) as IncomingWatch;

    // Verify captcha was completed
    const verification = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env["CaptchaSecret"]}&response=${watch.captchaToken}`)
        .then(res => res.json())
        .then(json => JSON.parse(json));
    if (!verification.success) return;

    // Insert the requests into the db
    const requests = watch.marketplaceIds.map(marketplaceId => ({
        marketplaceId,
        query: watch.query,
        price: watch.price,
        ttl: 24 * 60 * 60 * watch.dayCount
    } as Request));
    context.bindings.requests = JSON.stringify(requests);
}

export default httpTrigger;
