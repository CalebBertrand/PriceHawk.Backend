import { AzureFunction, Context, Timer } from "@azure/functions";

import { CosmosClient } from '@azure/cosmos';
import { MarketPlaces } from "../models/marketplaces.enum.js";
import { Request } from '../models/request.js';
import { RequestResult } from "./query-handlers/handler.js";
import { steamRequestHandler } from "./query-handlers/steam.js";

export const cosmosDBTrigger: AzureFunction = async function (context: Context, documents: Request[]): Promise<void> {
    context.res = await processRequests(documents);
}

export const timerTrigger: AzureFunction = async function (context: Context, timer: Timer): Promise<void> {
    const client = new CosmosClient(process.env["PriceHawkConnectionString"])
            .database('price-hawk').container('requests');

    const { resources } = await client.items.readAll().fetchAll();
    context.res = await processRequests(resources as Request[]);
}

async function processRequests(requests: Request[]): Promise<RequestResult[]> {
    const results: Array<RequestResult> = [];
    requests.forEach(async req => {
        switch(req.marketplaceId) {
            case(MarketPlaces.Steam):
                const steamResults = await steamRequestHandler(req.query, req.price);
                results.unshift(...steamResults.filter(res => matchesConditions(res, req)));
                break;
        }
    });

    return results;
}

function matchesConditions(result: RequestResult, request: Request): boolean {
    if (result.price > request.price) return false;

    const resultWords = result.name.split(' ');
    const requestWords = request.query.split(' ');
    // There is at least a 50% overlap in unique words
    return resultWords.filter(w => requestWords.includes(w)).length / requestWords.length >= 0.5;
}
