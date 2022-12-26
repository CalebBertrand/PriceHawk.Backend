import { CosmosClient } from "@azure/cosmos";
import { AzureFunction, HttpRequest, Context } from "@azure/functions";
import { ResponseCodes } from "../SharedCode/http-helpers/response-codes.enum.js";
import { generateResponse } from "../SharedCode/http-helpers/response-generator.js";
import { RequestResult } from "../SharedCode/query-handlers/handler.js";
import { filterByConditions, processRequest } from "../SharedCode/query-handlers/process-requests.js";
import { sanitizePreviewRequest } from "../SharedCode/utils/sanitation.js";
import { isValidPreviewRequest } from "../SharedCode/utils/validation.js";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const previewReq = req.body;

  if (!isValidPreviewRequest(previewReq)) {
      context.bindings.httpRes = generateResponse(ResponseCodes.InvalidContract);
      return;
  }
  sanitizePreviewRequest(previewReq);

  const cosmosClient = new CosmosClient(process.env["PriceHawkConnectionString"]).database('price-hawk');
  const marketplaceIds = previewReq.marketplaceIds.map(id => `${id}`).join(', ');
  const previewResultsQuery = await cosmosClient.container('results').items.query(`SELECT r.results FROM results AS r WHERE r.query = '${previewReq.query}' AND r.marketplaceId IN (${marketplaceIds})`).fetchNext();
  if (previewResultsQuery.resources.length) {
    const resultsForPrice = filterByConditions(previewResultsQuery.resources as Array<RequestResult>, previewReq);
    context.bindings.httpRes = { status: 200, body: resultsForPrice };
    return;
  }

  const filteredResults: Array<RequestResult> = [];
  previewReq.marketplaceIds.forEach(async marketplaceId => {
    const unfilteredResults = await processRequest({ query: previewReq.query, marketplaceId });
    await cosmosClient.container('results').items.upsert({ query: previewReq.query, marketplaceId, results: unfilteredResults });
    filteredResults.push(...filterByConditions(unfilteredResults, previewReq));
  });
  context.bindings.httpRes = { status: 200, body: filteredResults };
}

export default httpTrigger;
