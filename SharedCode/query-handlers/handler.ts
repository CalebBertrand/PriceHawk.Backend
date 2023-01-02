import { MarketPlaces } from "../marketplaces.enum.js";

export type RequestResult = {
    name: string;
    price: number;
    url: string;
    marketplaceId: MarketPlaces;
    description?: string;
    imageUrl?: string;
    rating?: number;
}

export type RequestHandler = (query: string) => Promise<Array<RequestResult>>;
