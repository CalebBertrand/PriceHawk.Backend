import { RequestHandler, RequestResult } from "./handler.js";
import { JSDOM } from 'jsdom';

const searchUrl = (search: string) => `https://www.amazon.com/s?k=${encodeURIComponent(search)}`;

export const amazonRequestHandler: RequestHandler = (query: string) => {
    return JSDOM.fromURL(searchUrl(query)).then(dom => {
        const elements: NodeListOf<HTMLDivElement> = dom.window.document.querySelectorAll('div[data-asin]');
        let results: Array<RequestResult> = [];
        elements.forEach(elm => {
            // Ignore sponsored results, they aren't very relevant
            const isSponsored = !!elm.querySelector('.s-sponsored-label-text');
            if (isSponsored) return;

            const linkElm: HTMLAnchorElement = elm.querySelector('h2 a');
            const url = linkElm.href;

            const titleElm: HTMLSpanElement = linkElm.querySelector('span');
            const name = titleElm.innerText;

            const imageElm: HTMLImageElement = elm.querySelector('.s-list-col-left a img');
            const imageUrl = imageElm.src;

            const priceElm: HTMLSpanElement = elm.querySelector('span.a-price');
            const price = parseInt(priceElm.innerText.replace(/[^\d.]/g, ''));

            const starElm: HTMLSpanElement = elm.querySelector('i.a-icon-star-small span.a-icon-alt');
            const rating = starElm ? parseFloat(starElm.innerText.substring(0, 3)) : undefined;

            results.push({ url, imageUrl, name, price, rating });
        });
        return results;
    });
}
