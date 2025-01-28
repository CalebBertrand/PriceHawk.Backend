import { MarketPlaces } from "../SharedCode/marketplaces.enum.js";

export type IncomingWatch = {
    contact: string;
    query: string;
    price: number;
    marketplaceIds: Array<MarketPlaces>;
    mustInclude: Array<string>;
    captchaToken: string;
    dayCount: number;
    verificationCode: number;
}
