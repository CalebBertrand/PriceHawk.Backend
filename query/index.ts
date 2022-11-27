import { AzureFunction, Context } from "@azure/functions";

import { CosmosClient, ItemDefinition } from '@azure/cosmos';
import { RequestResult } from "./query-handlers/handler.js";
import { steamRequestHandler } from "./query-handlers/steam.js";
import { MarketPlaces } from "./marketplaces.enum.js";
import { Request } from './request.js';

const cosmosDBTrigger: AzureFunction = async function (context: Context, documents: Request[]): Promise<void> {
    const client = new CosmosClient(process.env["PriceHawkConnectionString"])
        .database('price-hawk').container('requests');

    const { resources } = await client.items.readAll().fetchAll();
    const results: Array<RequestResult> = [];
    resources.forEach((item: ItemDefinition & Request) => {
        switch(item.marketplaceId) {
            case(MarketPlaces.Steam) {
                results.concat(await steamRequestHandler(item.query, item.price));
            }
        }
    });
    context.res = results;
}

export default cosmosDBTrigger;
