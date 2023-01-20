import { MarketPlaces } from "../marketplaces.enum.js";
import { RequestResult } from "./handler.js";
import { steamRequestHandler } from "./steam.js";
import { amazonRequestHandler } from "./amazon.js";
import { bestbuyRequestHandler } from "./bestbuy.js";

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

export function filterByConditions(
    results: Array<RequestResult>,
    request: { query: string, price: number, mustInclude?: string[] },
    preview = false
): Array<RequestResult> {
    const targetPrice = preview ? request.price * 1.5 : request.price;
    const mustIncludeLowerCase = request.mustInclude?.map(s => s.toLowerCase());
    const filtered = results.filter(result => 
        result.price <= targetPrice &&
        (
            !mustIncludeLowerCase?.length ||
            mustIncludeLowerCase.every(s => 
                result.name.toLowerCase().includes(s) ||
                result.description?.toLocaleLowerCase().includes(s)
            )
        )
    );
    return filtered.filter((_, i) => i < 15);
}
