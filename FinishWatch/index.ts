import { CosmosClient } from "@azure/cosmos";
import { AzureFunction, HttpRequest, Context } from "@azure/functions";
import { validate as uuidValidate } from 'uuid';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const requestId = req.query['id'];
  if (requestId && uuidValidate(requestId)) {
    const cosmosClient = new CosmosClient(process.env["PriceHawkConnectionString"])
      .database('price-hawk').container('requests');
    try {
      await cosmosClient.item(requestId, requestId).delete();
    } catch {
      context.bindings.httpRes = { status: 400 };
    }
  }
}

export default httpTrigger;
