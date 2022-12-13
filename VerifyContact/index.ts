import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { PendingVerification } from "../SharedCode/pending-verification.js";
import { randomInt } from 'node:crypto';
import client from '@sendgrid/mail';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const code = randomInt(10000, 99999);

    client.setApiKey(process.env["SENDGRID_API_KEY"]);
    await client.send({
      to: req.query["email"],
      from: process.env["NotificationsPrincipleName"],
      subject: 'Price Hawk Verification Code',
      templateId: process.env["VerificationEmailTemplateId"],
      dynamicTemplateData: {
        code: code
      }
    });

    context.bindings.pendingVerification = { email: req.query["email"], code } as PendingVerification;
}

export default httpTrigger;
