import { AzureFunction, Context, Timer } from "@azure/functions";

import { CosmosClient } from '@azure/cosmos';
import { Request } from '../SharedCode/request.js';
import sendgridClient from '@sendgrid/mail';
import { processRequest } from "../SharedCode/query-handlers/process-requests.js";

export const timerTrigger: AzureFunction = async function (context: Context, timer: Timer): Promise<void> {
    const cosmosClient = new CosmosClient(process.env["PriceHawkConnectionString"])
        .database('price-hawk').container('requests');
    const queryResults = await cosmosClient.items.readAll().fetchAll();

    sendgridClient.setApiKey(process.env["SENDGRID_API_KEY"]);

    const watches = queryResults.resources as Array<Request>;
    watches.forEach(async watch => {
        const results = await processRequest(watch);
        if (results.length) {
            await sendgridClient.send({
                to: watch.contact,
                from: process.env["NotificationsPrincipleName"],
                templateId: process.env["WatchResultsEmailTemplateId"],
                dynamicTemplateData: {
                    id: watch.id,
                    query: watch.query,
                    results
                }
            });
        }
    });
}
