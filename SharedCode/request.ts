import { ItemDefinition } from "@azure/cosmos";

export type Request = ItemDefinition & {
    contact: string;
    query: string;
    price: number;
    marketplaceId: number;
    mustInclude?: string[];
}
