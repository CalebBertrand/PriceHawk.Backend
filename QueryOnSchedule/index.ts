import { AzureFunction, Context, Timer } from "@azure/functions";

import { CosmosClient } from '@azure/cosmos';
import { Request } from '../SharedCode/request.js';
import { processRequests } from "../SharedCode/query-handlers/process-requests.js";

export const timerTrigger: AzureFunction = async function (context: Context, timer: Timer): Promise<void> {
    const client = new CosmosClient(process.env["PriceHawkConnectionString"])
            .database('price-hawk').container('requests');

    const { resources } = await client.items.readAll().fetchAll();
    context.res = await processRequests(resources as Request[]);
}
