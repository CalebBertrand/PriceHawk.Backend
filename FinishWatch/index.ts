import { CosmosClient } from "@azure/cosmos";
import { AzureFunction, HttpRequest } from "@azure/functions";
import { validate as uuidValidate } from 'uuid';

const httpTrigger: AzureFunction = async function (_, req: HttpRequest): Promise<void> {
  const requestId = req.query['id'];
  if (requestId && uuidValidate(requestId)) {
    const cosmosClient = new CosmosClient(process.env["PriceHawkConnectionString"])
      .database('price-hawk').container('requests');
    await cosmosClient.item(requestId).delete();
  }
}

export default httpTrigger;
