import { RequestHandler, RequestResult } from "./handler.js";

import { JSDOM } from 'jsdom';

const searchUrl = (search: string) => `https://store.steampowered.com/search/results?term=${encodeURI(search)}&force_infinite=1&supportedlang=english`;
const imageTypeRegex = new RegExp("/[^/]+\.jpg");

export const steamRequestHandler: RequestHandler = (query: string) => {
    return JSDOM.fromURL(searchUrl(query)).then(dom => {
        const elements: NodeListOf<HTMLAnchorElement> = dom.window.document.querySelectorAll('a.search_result_row');
        let results: Array<RequestResult> = [];
        elements.forEach(elm => {
            const url = elm.href;
            const imageUrl = elm.getElementsByTagName('img').item(0).src.replace(imageTypeRegex, "/header.jpg");
            const name = elm.getElementsByClassName('title').item(0).textContent;
            const price = +(elm.getElementsByClassName('search_price').item(0).textContent.split('$').pop().trim());

            results.push({ url, imageUrl, name, price });
        });
        return results;
    });
}
