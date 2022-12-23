import { AzureFunction, Context } from "@azure/functions";

import { Request } from '../SharedCode/request.js';
import { processRequest } from "../SharedCode/query-handlers/process-requests.js";
import client from '@sendgrid/mail';

export const cosmosDBTrigger: AzureFunction = async function (_, documents: Array<Request>): Promise<void> {
    client.setApiKey(process.env["SENDGRID_API_KEY"]);

    const watch = documents[0];
    const results = await processRequest(watch);
    if (results.length) {
        await client.send({
            to: watch.contact,
            from: process.env["NotificationsPrincipleName"],
            templateId: process.env["WatchResultsEmailTemplateId"],
            dynamicTemplateData: {
                query: watch.query,
                results
            }
        });
    }
}
