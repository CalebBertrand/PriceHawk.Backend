import * as msal from "@azure/msal-node";

export async function getMsalAuth(done) {
    try {
        const msalClient = new msal.ConfidentialClientApplication({
            auth: {
                clientId: process.env["MsalClientId"],
                clientSecret: process.env["MsalClientSecret"]
            }
        });

        const { accessToken } = await msalClient.acquireTokenByClientCredential({ scopes: ['Mail.Send'] });
        done(null, accessToken);
      } catch (err) {
        console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        done(err, null);
      }
}
