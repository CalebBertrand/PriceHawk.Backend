import * as msal from "@azure/msal-node";

export async function graphAuthProvider(done) {
    try {
        const msalClient = new msal.ConfidentialClientApplication({
            auth: {
                clientId: process.env["MsalClientId"],
                clientSecret: process.env["MsalClientSecret"],
                authority: 'https://login.microsoftonline.com/' + process.env["MsalTenantId"]
            }
        });

        const { accessToken } = await msalClient.acquireTokenByClientCredential({
          scopes: ['https://graph.microsoft.com/.default']
        });
        done(null, accessToken);
      } catch (err) {
        console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        done(err, null);
      }
}
