import { MarketPlaces } from "../marketplaces.enum.js";
import { Request } from '../request.js';
import { RequestResult } from "./handler.js";
import { steamRequestHandler } from "./steam.js";

export async function processRequests(requests: Request[]): Promise<RequestResult[]> {
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
