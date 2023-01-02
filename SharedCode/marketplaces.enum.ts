export enum MarketPlaces {
    Steam = 1,
    Amazon = 2,
    BustBuy = 3
}

const ids = Object.values(MarketPlaces).filter(v => typeof v === 'number') as Array<MarketPlaces>;
export const marketPlaceIds = new Set(ids);
