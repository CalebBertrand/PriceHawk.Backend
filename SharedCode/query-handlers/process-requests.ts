import { MarketPlaces } from "../marketplaces.enum.js";
import { RequestResult } from "./handler.js";
import { steamRequestHandler } from "./steam.js";
import fuzzysort from "fuzzysort";
import { amazonRequestHandler } from "./amazon.js";

export async function processRequest(request: { query: string, marketplaceId: MarketPlaces }): Promise<RequestResult[]> {
    switch(request.marketplaceId) {
        case(MarketPlaces.Steam):
            return await steamRequestHandler(request.query);
        case(MarketPlaces.Amazon):
            return await amazonRequestHandler(request.query);
    }
}

export function filterByConditions(results: Array<RequestResult>, request: { query: string, price: number }): Array<RequestResult> {
    const inPriceRange = results.filter(result => result.price <= request.price);
    return fuzzysort.go(request.query, inPriceRange, { threshold: -750, key: 'name' }).map(filtered => filtered.obj);
}
