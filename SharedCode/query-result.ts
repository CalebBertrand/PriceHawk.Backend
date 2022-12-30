import { ItemDefinition } from "@azure/cosmos";
import { MarketPlaces } from "./marketplaces.enum.js";
import { RequestResult } from "./query-handlers/handler.js";

export type QueryResults = ItemDefinition & {
    query: string;
    marketplaceId: MarketPlaces;
    results: Array<RequestResult>;
}
