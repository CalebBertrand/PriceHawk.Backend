import { Query } from "../query";

export type QueryResult = {
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    url: string;
}

export type QueryHandler = (query: Query) => Promise<Array<QueryResult>>;