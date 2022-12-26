import { IncomingWatch } from "../../Requests/incoming-watch.js";
import { PreviewRequest } from "../preview-request.js";

export function sanitizeString(str: string): string {
    return str.replace(/['"]/g, "");
}

export function sanitizeWatch(contract: IncomingWatch): void {
    contract.query = sanitizeString(contract.query);
    contract.contact = sanitizeString(contract.contact);
}

export function sanitizePreviewRequest(contract: PreviewRequest): void {
    contract.query = sanitizeString(contract.query);
}
