import { Request } from "../request.js";

export type RequestResult = {
    name: string;
    price: number;
    url: string;
    description?: string;
    imageUrl?: string;
}

export type RequestHandler = (query: string) => Promise<Array<RequestResult>>;
