import { MarketPlaces } from "../SharedCode/marketplaces.enum.js";
import { Request } from "../SharedCode/request.js";

export type IncomingWatch = Request & {
    marketplaceIds: MarketPlaces[];
    captchaToken: string;
    dayCount: number;
    verificationCode: number;
}
