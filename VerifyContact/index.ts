import { AuthenticationProvider, AuthenticationProviderOptions, Client } from "@microsoft/microsoft-graph-client";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { PendingVerification } from "../SharedCode/pending-verification.js";
import { getMsalAuth } from "../SharedCode/graph-auth-provider.js";
import { randomInt } from 'node:crypto';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const code = randomInt(10000, 99999).toString();

    const client = Client.init({ authProvider: getMsalAuth });
    const sendMail = {
      message: {
        subject: 'Price Hawk Verification Code',
        body: {
          contentType: 'Text',
          content: `Your verification code is: ${code}`
        },
        toRecipients: [
          {
            emailAddress: {
              address: req.params["email"]
            }
          }
        ]
      },
      saveToSentItems: 'false'
    };
    await client.api(`/users/${process.env['NotificationsUserObjectId']}/sendMail`).post(sendMail);

    context.bindings.pendingVerification = { email: req.params["email"], code } as PendingVerification;
}

export default httpTrigger;
