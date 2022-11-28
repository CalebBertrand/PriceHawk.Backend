import { ItemDefinition } from "@azure/cosmos";

export type Request = ItemDefinition & {
    query: string;
    price: number;
    marketplaceId: number;
}
