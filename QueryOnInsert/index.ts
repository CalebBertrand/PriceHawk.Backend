import { AzureFunction } from "@azure/functions";

import { Request } from '../SharedCode/request.js';
import { filterByConditions, processRequest } from "../SharedCode/query-handlers/process-requests.js";
import client from '@sendgrid/mail';
import { CosmosClient } from "@azure/cosmos";

export const cosmosDBTrigger: AzureFunction = async function (_, documents: Array<Request>): Promise<void> {
    client.setApiKey(process.env["SENDGRID_API_KEY"]);

    const watch = documents[0];
    const results = await processRequest(watch);
    if (!results.length) return;
    const cosmosClient = new CosmosClient(process.env["PriceHawkConnectionString"]).database('price-hawk');
    const watchQuery = watch.query.trim().toLowerCase();
    await cosmosClient.container('results').items.upsert({ query: watchQuery, marketplaceId: watch.marketplaceId, results: results });

    const filteredResults = filterByConditions(results, watch);
    if (filteredResults.length) {
        await client.send({
            to: watch.contact,
            from: process.env["NotificationsPrincipleName"],
            templateId: process.env["WatchResultsEmailTemplateId"],
            dynamicTemplateData: {
                id: watch.id,
                query: watch.query,
                results: filteredResults
            }
        });
    }
}
