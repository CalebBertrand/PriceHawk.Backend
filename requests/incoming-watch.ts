import { MarketPlaces } from "../SharedCode/marketplaces.enum.js";

export type IncomingWatch = {
    contact: string;
    query: string;
    price: number;
    marketplaceIds: MarketPlaces[];
    captchaToken: string;
    dayCount: number;
    verificationCode: number;
}
