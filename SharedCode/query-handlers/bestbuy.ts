import { RequestHandler, RequestResult } from "./handler.js";
import { JSDOM } from 'jsdom';
import { MarketPlaces } from "../marketplaces.enum.js";

const searchUrl = (search: string) => `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(search)}&_dyncharset=UTF-8&type=page&sc=Global&usc=All+Categories`;

export const bestbuyRequestHandler: RequestHandler = (query: string) => {
    return JSDOM.fromURL(searchUrl(query)).then(dom => {
        const elements: NodeListOf<HTMLDivElement> = dom.window.document.querySelectorAll('.sku-item');
        let results: Array<RequestResult> = [];
        let i = 0;
        elements.forEach(elm => {
            if (i++ > 20) return;

            const linkElm: HTMLAnchorElement = elm.querySelector('.sku-title a');
            if (!linkElm) return;
            const url = linkElm.href;
            const name = linkElm.innerHTML;

            const imageElm: HTMLImageElement = elm.querySelector('a > img.product-image');
            if (!imageElm) return;
            const imageUrl = imageElm.src;

            const priceElm: HTMLSpanElement = elm.querySelector('.sku-list-item-price span.sr-only');
            if (!priceElm) return;
            const price = parseInt(priceElm.innerHTML.replace(/[^\d.]/g, ''));

            let rating = undefined;
            const starElm: HTMLSpanElement = elm.querySelector('.ratings-reviews .visually-hidden');
            if (starElm) {
                const ratingPoint = starElm.innerHTML.indexOf(".");
                rating = parseFloat(starElm.innerHTML.substring(ratingPoint - 1, ratingPoint + 2))
            }

            results.push({ url, imageUrl, name, price, rating, marketplaceId: MarketPlaces.BustBuy });
        });
        return results;
    });
}
