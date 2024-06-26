import { IncomingWatch } from "../../Requests/incoming-watch.js";
import { marketPlaceIds } from "../marketplaces.enum.js";
import { PreviewRequest } from "../preview-request.js";
import { QueryResults } from "../query-result.js";

export function isNullOrWhiteSpace(str: string): boolean {
    return !str || str.trim().length === 0;
}

export function isValidWatch(contract: unknown): contract is IncomingWatch {
    return (
        contract 
        && typeof +contract['price'] === 'number'
        && typeof contract['verificationCode'] === 'number'
        && typeof contract['contact'] === 'string'
        && contract['contact'].length < 30
        && !/[\s'"]/.test(contract['contact'])
        && /^\S+@\S+\.\S+$/.test(contract['contact'])
        && typeof contract['query'] === 'string'
        && !isNullOrWhiteSpace(contract['query'])
        && Array.isArray(contract['marketplaceIds'])
        && contract['marketplaceIds'].every(id => marketPlaceIds.has(id))
    );
}

export function isValidPreviewRequest(contract: unknown): contract is PreviewRequest {
    return (
        contract
        && typeof +contract['price'] === 'number'
        && typeof contract['query'] === 'string'
        && !isNullOrWhiteSpace(contract['query'])
        && Array.isArray(contract['marketplaceIds'])
        && contract['marketplaceIds'].every(id => marketPlaceIds.has(id))
    );
}

export function isValidQueryResult(contract: unknown): contract is QueryResults {
    return (
        contract
        && typeof contract['marketplaceId'] === 'number'
        && typeof contract['query'] === 'string'
        && !isNullOrWhiteSpace(contract['query'])
        && Array.isArray(contract['results'])
    )
}
