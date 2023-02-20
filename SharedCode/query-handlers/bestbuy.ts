import { RequestHandler, RequestResult } from "./handler.js";
import { JSDOM } from 'jsdom';
import { MarketPlaces } from "../marketplaces.enum.js";

const searchUrl = (search: string) => `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(search)}&_dyncharset=UTF-8&type=page&sc=Global&usc=All+Categories`;

const jsdomOpts = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
};

export const bestbuyRequestHandler: RequestHandler = (query: string) => {
    return JSDOM.fromURL(searchUrl(query), jsdomOpts).then(dom => {
        const elements: NodeListOf<HTMLDivElement> = dom.window.document.querySelectorAll('.sku-item');
        let results: Array<RequestResult> = [];
        elements.forEach(elm => {
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
        return results.slice(0, 21);
    });
}
