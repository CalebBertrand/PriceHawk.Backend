import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import 'isomorphic-fetch';
import { Client } from "@microsoft/microsoft-graph-client";
import { PendingVerification } from "../SharedCode/pending-verification.js";
import { graphAuthProvider } from "../SharedCode/graph-auth-provider.js";
import { randomInt } from 'node:crypto';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const code = randomInt(10000, 99999);

    const client = Client.init({ authProvider: graphAuthProvider });
    const sendMail = {
      message: {
        subject: 'Price Hawk Verification Code',
        body: {
          contentType: 'text/plain',
          content: `Your verification code is: ${code}`
        },
        toRecipients: [
          {
            emailAddress: {
              address: req.query["email"]
            }
          }
        ],
        from: {
          emailAddress: {
            address: process.env["NotificationsPrincipleName"]
          }
        }
      },
      saveToSentItems: 'false'
    };
    await client.api(`/users/${process.env["NotificationsPrincipleName"]}/sendMail`)
      .post(sendMail)
      .catch(err => console.log(err));

    context.bindings.pendingVerification = { email: req.query["email"], code } as PendingVerification;
}

export default httpTrigger;
