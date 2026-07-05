"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const result = await prisma.$queryRaw `
    SELECT
        COALESCE(dam.date, rtm.date, gdam.date) AS date,
        COALESCE(dam.timeblock, rtm.timeblock, gdam.timeblock) AS timeblock,
        dam.mcp AS dam_mcp,
        rtm.mcp AS rtm_mcp,
        gdam.mcp AS gdam_mcp
    FROM
        (SELECT d."deliveryDate" as date, dr."intervalNumber" as timeblock, dr.mcp 
         FROM "DamRecord" dr 
         JOIN "Dataset" d ON dr."datasetId" = d.id 
         WHERE d.market = 'DAM') dam
    FULL OUTER JOIN
        (SELECT d."deliveryDate" as date, rr."intervalNumber" as timeblock, rr.mcp 
         FROM "RtmRecord" rr 
         JOIN "Dataset" d ON rr."datasetId" = d.id 
         WHERE d.market = 'RTM') rtm
        ON dam.date = rtm.date AND dam.timeblock = rtm.timeblock
    FULL OUTER JOIN
        (SELECT d."deliveryDate" as date, gr."intervalNumber" as timeblock, gr.mcp 
         FROM "GdamRecord" gr 
         JOIN "Dataset" d ON gr."datasetId" = d.id 
         WHERE d.market = 'GDAM') gdam
        ON COALESCE(dam.date, rtm.date) = gdam.date AND COALESCE(dam.timeblock, rtm.timeblock) = gdam.timeblock
    ORDER BY date DESC, timeblock ASC
    LIMIT 10;
  `;
    console.log(result);
}
main().catch(console.error).finally(() => prisma.$disconnect());
