import { AzureFunction } from "@azure/functions";

import { Request } from '../SharedCode/request.js';
import { filterByConditions } from "../SharedCode/query-handlers/process-requests.js";
import client from '@sendgrid/mail';
import { CosmosClient, ItemDefinition } from "@azure/cosmos";
import { isValidQueryResult } from "../SharedCode/utils/validation.js";
import appInsights from 'applicationinsights';

export const cosmosDBTrigger: AzureFunction = async function (_, documents: Array<ItemDefinition>): Promise<void> {
    const inserted = documents[0];
    if (!isValidQueryResult(inserted)) {
        appInsights.setup(process.env['APPLICATIONINSIGHTS_CONNECTION_STRING']).start();
        appInsights.defaultClient.trackEvent({
            name: `QueryResult with id ${inserted.id} failed validation. MarketplaceId: ${JSON.stringify(inserted['marketplaceId'])}. Query: ${JSON.stringify(inserted['query'])}.`,
        });
        return;
    }
    const { marketplaceId, query, results } = inserted;

    client.setApiKey(process.env["SENDGRID_API_KEY"]);
    const cosmosClient = new CosmosClient(process.env["AZURE_COSMOS_CONNECTIONSTRING"]).database('price-hawk');

    const matchingWatchesQuerySpec = {
        query: `SELECT * FROM requests AS r WHERE r.marketplaceId = @marketplaceId AND r.query = @query`,
        parameters: [
            {
                name: '@marketplaceId',
                value: marketplaceId
            },
            {
                name: '@query',
                value: query
            }
        ]
    };
    const matchingWatchesQuery = await cosmosClient.container('requests').items.query(matchingWatchesQuerySpec).fetchAll();
    if (!matchingWatchesQuery.resources.length) return;

    const matchingWatches = matchingWatchesQuery.resources as Array<Request>;
    await Promise.all(
        matchingWatches.map(async watch => {
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
        })
    );
}
