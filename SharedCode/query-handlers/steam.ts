import { RequestHandler, RequestResult } from "./handler.js";

import { JSDOM } from 'jsdom';
import { MarketPlaces } from "../marketplaces.enum.js";

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

            const ratingTooltipData = elm.querySelector('.search_review_summary')?.getAttribute('data-tooltip-html');
            let rating = undefined;
            if (ratingTooltipData) {
                if (ratingTooltipData.includes('Overwhelmingly Positive'))
                    rating = 5;
                else if (ratingTooltipData.includes('Very Positive'))
                    rating =  0.87 * 5;
                else if (ratingTooltipData.includes('Mostly Positive'))
                    rating =  0.75 * 5;
                else if (ratingTooltipData.includes('Positive'))
                    rating =  0.81 * 5;
                else if (ratingTooltipData.includes('Mixed'))
                    rating =  0.55 * 5;
                else if (ratingTooltipData.includes('Mostly Negative'))
                    rating =  0.3 * 5;
                else if (ratingTooltipData.includes('Very Negative'))
                    rating =  0.2 * 5;
                else if (ratingTooltipData.includes('Overwhelmingly Negative'))
                    rating =  0.1 * 5;
                else if (ratingTooltipData.includes('Negative'))
                    rating =  0.25 * 5;
            }

            results.push({ url, imageUrl, name, price, rating, marketplaceId: MarketPlaces.Steam });
        });
        return results;
    });
}
