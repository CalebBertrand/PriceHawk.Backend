import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { IncomingWatch } from "./incoming-watch.js";
import { Request } from "../SharedCode/request.js";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const body = JSON.parse(req.body) as IncomingWatch;

    // Verify captcha was completed
    const captchaSecret = '6Lc_a0wjAAAAAByR-CsOxSCVMSw9o5EPJa-dxhMK';
    const watch = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${captchaSecret}&response=${body.captchaToken}`)
        .then(res => res.json())
        .then(json => JSON.parse(json));
    if (!watch.success) return;

    // Insert the requests into the db
    const ttl = 24 * 60 * 60 * watch.dayCount;
    const requests = body.marketplaceIds.map(marketplaceId => ({
        marketplaceId,
        query: body.query,
        price: body.price,
        ttl
    } as Request));
    context.bindings.requests = JSON.stringify(requests);
}

export default httpTrigger;
