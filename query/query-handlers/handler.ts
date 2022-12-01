import { Request } from "../../SharedCode/request.js";

export type RequestResult = {
    name: string;
    price: number;
    url: string;
    description?: string;
    imageUrl?: string;
}

export type RequestHandler = (query: string, searchPrice: number) => Promise<Array<RequestResult>>;
