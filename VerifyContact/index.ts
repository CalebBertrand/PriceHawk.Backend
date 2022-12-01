import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { PendingVerification } from "../SharedCode/pending-verification.js";
import { randomInt } from 'node:crypto';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const code = randomInt(10000, 99999).toString();
    context.bindings.pendingVerification = { email: req.params["email"], code } as PendingVerification;
}

export default httpTrigger;
