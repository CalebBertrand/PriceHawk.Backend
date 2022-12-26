import { RequestResult } from "./query-handlers/handler.js";

export type QueryResults = {
    query: string;
    results: Array<RequestResult>;
}
