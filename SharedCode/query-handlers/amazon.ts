import { RequestHandler, RequestResult } from "./handler.js";
import { JSDOM } from 'jsdom';
import { MarketPlaces } from "../marketplaces.enum.js";

const searchUrl = (search: string) => `https://www.amazon.com/s?k=${encodeURIComponent(search)}`;
const convertImgUrlToLargerRes = (url: string) => {
    const segments = url.split('.');
    segments.splice(segments.length - 2, 1);
    return segments.join('.');
};

const jsdomOpts = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
};

export const amazonRequestHandler: RequestHandler = (query: string) => {
    return JSDOM.fromURL(searchUrl(query), jsdomOpts).then(dom => {
        const elements: NodeListOf<HTMLDivElement> = dom.window.document.querySelectorAll('.s-result-item[role="listitem"]');
        let results: Array<RequestResult> = [];
        elements.forEach(elm => {
            // Ignore sponsored results, they aren't very relevant
            const isSponsored = !!elm.querySelector('.s-sponsored-label-text');
            if (isSponsored) return;

            const linkElm: HTMLAnchorElement = elm.querySelector('a:has(> h2)');
            if (!linkElm) return;
            const url = `${linkElm.href}&tag=${process.env['AmazonAssociateId']}`;

            const titleElm: HTMLSpanElement = linkElm.querySelector('span');
            if (!titleElm) return;
            const name = titleElm.innerHTML;

            const imageElm: HTMLImageElement = elm.querySelector('.s-product-image-container a img');
            if (!imageElm) return;
            const imageUrl = convertImgUrlToLargerRes(imageElm.src);

            const priceElm: HTMLSpanElement = elm.querySelector('span.a-price span.a-price-whole');
            if (!priceElm) return;
            const price = parseInt(priceElm.innerHTML.replace(/[^\d]/g, ''), 10);

            const starElm: HTMLSpanElement = elm.querySelector('i.a-icon-star-small span.a-icon-alt');
            const rating = starElm ? parseFloat(starElm.innerHTML.substring(0, 3)) : undefined;

            results.push({ url, imageUrl, name, price, rating, marketplaceId: MarketPlaces.Amazon });
        });
        return results.slice(0, 20);
    });
}
