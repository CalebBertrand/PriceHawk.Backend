import { MarketPlaces } from "../marketplaces.enum.js";
import { Request } from '../request.js';
import { RequestResult } from "./handler.js";
import { steamRequestHandler } from "./steam.js";

export async function processRequest(request: Request): Promise<RequestResult[]> {
    switch(request.marketplaceId) {
        case(MarketPlaces.Steam):
            const steamResults = await steamRequestHandler(request.query);
            return steamResults.filter(res => matchesConditions(res, request));
    }
}

function matchesConditions(result: RequestResult, request: Request): boolean {
    return result.price <= request.price && new RegExp(request.query, 'i').test(result.name);
}
