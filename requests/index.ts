import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { CosmosClient, ItemDefinition } from '@azure/cosmos';

import { MarketPlaces } from "../SharedCode/marketplaces.enum.js";
import { Request } from '../SharedCode/request.js';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const client = new CosmosClient(process.env["PriceHawkConnectionString"])
        .database('price-hawk').container('pending-verifications');

    context.bindings.requests = JSON.stringify([
        // All the requests for each marketplace
    ]);
}

export default httpTrigger;
