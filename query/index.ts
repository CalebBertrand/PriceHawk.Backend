import { AzureFunction, Context } from "@azure/functions"

import { steamQueryHandler } from "./query-handlers/steam";

const cosmosDBTrigger: AzureFunction = async function (context: Context, documents: any[]): Promise<void> {
    if (!!documents && documents.length > 0) {
        context.log('Document Id: ', documents[0].id);

        await steamQueryHandler({ queryString: 'No Mans Sky', price: 15 });
    }
}

export default cosmosDBTrigger;
