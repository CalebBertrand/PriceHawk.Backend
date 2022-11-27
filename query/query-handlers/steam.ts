import { JSDOM } from 'jsdom';
import { RequestResult } from "./handler.js";

const searchUrl = (search: string) => `https://store.steampowered.com/search/results?term=${encodeURI(search)}&force_infinite=1&supportedlang=english`;

export function steamRequestHandler(query: string, price: number): Promise<Array<RequestResult>> {
    return JSDOM.fromURL(searchUrl('No Mans Sky')).then(dom => {
        const elements: NodeListOf<HTMLAnchorElement> = dom.window.document.querySelectorAll('a.search_result_row');
        let results: Array<RequestResult> = [];
        elements.forEach(elm => {
            const url = elm.href;
            const imageUrl = elm.getElementsByTagName('img').item(0).src;
            const name = elm.getElementsByClassName('title').item(0).textContent;
            const price = +(elm.getElementsByClassName('search_price').item(0).textContent.split('$').pop().trim());

            results.push({ url, imageUrl, name, price });
        });
        return results;
    });
}
