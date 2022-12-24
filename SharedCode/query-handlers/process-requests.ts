import { MarketPlaces } from "../marketplaces.enum.js";
import { Request } from '../request.js';
import { RequestResult } from "./handler.js";
import { steamRequestHandler } from "./steam.js";
import fuzzysort from "fuzzysort";

export async function processRequest(request: Request): Promise<RequestResult[]> {
    switch(request.marketplaceId) {
        case(MarketPlaces.Steam):
            const steamResults = await steamRequestHandler(request.query);
            return filterByConditions(steamResults, request);
    }
}

function filterByConditions(results: Array<RequestResult>, request: Request): Array<RequestResult> {
    const inPriceRange = results.filter(result => result.price <= request.price);
    return fuzzysort.go(request.query, inPriceRange, { threshold: -30, key: 'name' }).map(filtered => filtered.obj);
}
