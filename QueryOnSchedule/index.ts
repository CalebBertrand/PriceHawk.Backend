import { AzureFunction } from "@azure/functions";
import { CosmosClient, OperationInput } from '@azure/cosmos';
import { Request } from '../SharedCode/request.js';
import sendgridClient from '@sendgrid/mail';
import { filterByConditions, processRequest } from "../SharedCode/query-handlers/process-requests.js";
import { QueryResults } from "../SharedCode/query-result.js";
import { uniqBy } from 'lodash-es';

export const timerTrigger: AzureFunction = async function (): Promise<void> {
    sendgridClient.setApiKey(process.env["SENDGRID_API_KEY"]);

    const cosmosClient = new CosmosClient(process.env["PriceHawkConnectionString"]).database('price-hawk');
    const requestsQuery = await cosmosClient.container('requests').items.readAll().fetchAll();
    const resultsQuery = await cosmosClient.container('results').items.readAll().fetchAll();
    const watches = requestsQuery.resources as Array<Request>;
    const lastResultsByQuery = resultsQuery.resources as Array<QueryResults>;

    const uniqueMarketplaceQueries = uniqBy(
        watches.map(watch => ({
            marketplaceId: watch.marketplaceId,
            query: watch.query.trim().toLowerCase()
        })), ({ marketplaceId, query }) => `${marketplaceId}:${query}`
    );
 
    const replaceResultOps: OperationInput[] = [];
    const updatedResultsByQuery: Array<QueryResults> = await Promise.all(
        uniqueMarketplaceQueries.map(async ({ marketplaceId, query }) => {
            const lastQueryResult = lastResultsByQuery.find(r => r.query === query && r.marketplaceId === marketplaceId);
            const results = await processRequest({ query, marketplaceId });

            // If the query has no previous results, use the ones we just got
            if (!lastQueryResult) return { query, marketplaceId, results };

            // If there was a previous result, we'll need to replace it with the new one
            const id = `${marketplaceId}:${query}`;
            replaceResultOps.push({
                operationType: "Replace",
                partitionKey: query,
                id,
                resourceBody: { id, query, marketplaceId, results }
            });

            // Otherwise, the updated results should be the ones that are either new or have different prices
            const updatedResults = results.filter(result => {
                const lastResult = lastQueryResult.results.find(r => r.name === result.name);
                if (!lastResult) return true;
                return lastResult.price !== result.price;
            });
            return { query, marketplaceId, results: updatedResults };
        })
    );
    await cosmosClient.container('results').items.bulk(replaceResultOps);

    await Promise.all(
        watches.map(async watch => {
            const updatedWatchResults = filterByConditions(
                updatedResultsByQuery.find(r => r.marketplaceId === watch.marketplaceId && r.query === watch.query).results,
                watch
            );
            if (updatedWatchResults.length) {
                await sendgridClient.send({
                    to: watch.contact,
                    from: process.env["NotificationsPrincipleName"],
                    templateId: process.env["WatchResultsEmailTemplateId"],
                    dynamicTemplateData: {
                        id: watch.id,
                        query: watch.query,
                        results: updatedWatchResults
                    }
                });
            }
        })
    );
}
