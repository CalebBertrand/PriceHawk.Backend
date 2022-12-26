import { AzureFunction, Context, Timer } from "@azure/functions";

import { CosmosClient } from '@azure/cosmos';
import { Request } from '../SharedCode/request.js';
import sendgridClient from '@sendgrid/mail';
import { filterByConditions, processRequest } from "../SharedCode/query-handlers/process-requests.js";
import { RequestResult } from "../SharedCode/query-handlers/handler.js";

export const timerTrigger: AzureFunction = async function (): Promise<void> {
    sendgridClient.setApiKey(process.env["SENDGRID_API_KEY"]);

    const cosmosClient = new CosmosClient(process.env["PriceHawkConnectionString"]).database('price-hawk');
    const requestsQuery = await cosmosClient.container('requests').items.readAll().fetchAll();
    const resultsQuery = await cosmosClient.container('results').items.readAll().fetchAll();
    const watches = requestsQuery.resources as Array<Request>;
    const results = resultsQuery.resources as Array<{ query: string, results: Array<RequestResult> }>;
    watches.forEach(async watch => {
        const watchQuery = watch.query.trim().toLowerCase();
        const lastResult = results.find(({ query }) => query === watchQuery);
        let watchResults = lastResult?.results;
        if (!watchResults?.length || watch.ttl < 60 * 60 * 24 * 2) {
            const newResults = await processRequest(watch);
            watchResults = filterByConditions(newResults, watch);
            await cosmosClient.container('results').items.upsert({ query: watchQuery, results: watchResults });
            lastResult.results = watchResults;
        }

        if (watchResults.length) {
            await sendgridClient.send({
                to: watch.contact,
                from: process.env["NotificationsPrincipleName"],
                templateId: process.env["WatchResultsEmailTemplateId"],
                dynamicTemplateData: {
                    id: watch.id,
                    query: watch.query,
                    results: watchResults
                }
            });
        }
    });
}
