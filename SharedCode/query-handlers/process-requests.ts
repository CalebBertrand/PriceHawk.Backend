import { MarketPlaces } from "../marketplaces.enum.js";
import { RequestResult } from "./handler.js";
import { steamRequestHandler } from "./steam.js";
import fuzzysort from "fuzzysort";
import { amazonRequestHandler } from "./amazon.js";
import { bestbuyRequestHandler } from "./bestbuy.js";

const sortThreshold = -1750;

export async function processRequest(request: { query: string, marketplaceId: MarketPlaces }): Promise<RequestResult[]> {
    switch(request.marketplaceId) {
        case(MarketPlaces.Steam):
            return await steamRequestHandler(request.query);
        case(MarketPlaces.Amazon):
            return await amazonRequestHandler(request.query);
        case (MarketPlaces.BustBuy):
            return await bestbuyRequestHandler(request.query);
    }
}

export function filterByConditions(results: Array<RequestResult>, request: { query: string, price: number }, preview = false): Array<RequestResult> {
    const targetPrice = preview ? request.price * 1.5 : request.price;
    const inPriceRange = results.filter(result => result.price <= targetPrice);
    return fuzzysort.go(request.query, inPriceRange, { key: 'name' })
        .filter(({ score }, i) => i < 6 || score > sortThreshold)
        .map(({ obj }) => obj);
}
