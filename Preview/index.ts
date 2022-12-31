import { CosmosClient } from "@azure/cosmos";
import { AzureFunction, HttpRequest, Context } from "@azure/functions";
import { ResponseCodes } from "../SharedCode/http-helpers/response-codes.enum.js";
import { generateResponse } from "../SharedCode/http-helpers/response-generator.js";
import { RequestResult } from "../SharedCode/query-handlers/handler.js";
import { filterByConditions, processRequest } from "../SharedCode/query-handlers/process-requests.js";
import { QueryResults } from "../SharedCode/query-result.js";
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

  // The aggregated results
  const filteredResults: Array<RequestResult> = [];

  // If possible, re-use results that already exist
  const marketplaceIds = previewReq.marketplaceIds.map(id => `${id}`).join(', ');
  const normalizedQuery = previewReq.query.trim().toLowerCase();
  const previewResultsQuery = await cosmosClient.container('results').items
    .query(`SELECT * FROM results AS r WHERE r.query = '${normalizedQuery}' AND r.marketplaceId IN (${marketplaceIds})`)
    .fetchAll();
  const previousResults = previewResultsQuery.resources as Array<QueryResults>;
  filteredResults.push(
    ...previousResults.flatMap(({ results }) => filterByConditions(results, previewReq))
  );

  // Still need to cover any queries in marketplaces that didn't pre-exist
  const newMarketplaceIds = previewReq.marketplaceIds.filter(id => previousResults.every(({ marketplaceId }) => id !== marketplaceId));
  await Promise.all(
      // When more marketplaces are added, need to only run for the results that don't already exist
      newMarketplaceIds.map(async marketplaceId => {
        const unfilteredResults = await processRequest({ query: previewReq.query, marketplaceId });
        await cosmosClient.container('results').items.create({
          id: `${marketplaceId}:${normalizedQuery}`,
          query: normalizedQuery,
          marketplaceId: marketplaceId,
          results: unfilteredResults
        });
        filteredResults.push(...filterByConditions(unfilteredResults, previewReq));
      })
  );

  context.bindings.httpRes = { status: 200, body: filteredResults };
}

export default httpTrigger;
