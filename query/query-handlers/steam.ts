import { Query } from "../query";
import { QueryResult } from "./handler";

const searchUrl = (search: string) => `https://store.steampowered.com/search/results?term=${encodeURI(search)}&force_infinite=1&supportedlang=english`;

export function steamQueryHandler(query: Query): Promise<Array<QueryResult>> {
    return fetch(searchUrl(query.queryString))
        .then(res => console.log(res))
        .then(res => []);
}
