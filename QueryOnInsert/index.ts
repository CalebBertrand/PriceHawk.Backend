import { AzureFunction, Context, Timer } from "@azure/functions";

import { CosmosClient } from '@azure/cosmos';
import { Request } from '../SharedCode/request.js';
import { processRequests } from "../SharedCode/query-handlers/process-requests.js";

export const cosmosDBTrigger: AzureFunction = async function (context: Context, documents: Request[]): Promise<void> {
    context.res = await processRequests(documents);
}
