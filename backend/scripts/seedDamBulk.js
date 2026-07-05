"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const filePath = path_1.default.join(__dirname, '../../dam_blocks.csv'); // The user's file is at the workspace root
    if (!fs_1.default.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }
    console.log(`Starting bulk seed from ${filePath}`);
    let currentRowCount = 0;
    let currentGroup = [];
    let currentDeliveryDate = '';
    const processGroup = async (dateStr, rows) => {
        if (rows.length === 0)
            return;
        // dateStr is '2022-04-01'
        const deliveryDate = new Date(`${dateStr}T00:00:00Z`);
        try {
            // 1. Check if dataset already exists
            const existing = await prisma.dataset.findFirst({
                where: { market: 'DAM', deliveryDate }
            });
            if (existing) {
                console.log(`[SKIP] Dataset for ${dateStr} already exists. Skipping ${rows.length} rows.`);
                return;
            }
            // 2. Create Dataset
            const dataset = await prisma.dataset.create({
                data: {
                    market: 'DAM',
                    deliveryDate,
                    status: 'ACTIVE',
                    fileName: 'dam_blocks.csv'
                }
            });
            // 3. Prepare records
            const damRecords = rows.map((row, index) => {
                // "Time Block" is like "00:00 - 00:15". We want the start time.
                const timeBlockStr = row['Time Block'] || '';
                const intervalTime = timeBlockStr.split(' ')[0] || '00:00';
                return {
                    datasetId: dataset.id,
                    intervalNumber: index + 1,
                    intervalTime: intervalTime,
                    purchaseBid: parseFloat(row['Purchase Bid (MW)']) || 0,
                    sellBid: parseFloat(row['Sell Bid (MW)']) || 0,
                    mcv: parseFloat(row['MCV (MW)']) || 0,
                    fsv: parseFloat(row['Final Scheduled Volume (MW)']) || 0,
                    mcp: parseFloat(row['MCP (Rs/MWh)']) || 0,
                };
            });
            // 4. Insert
            await prisma.damRecord.createMany({
                data: damRecords
            });
            console.log(`[SUCCESS] Inserted ${damRecords.length} records for ${dateStr}`);
        }
        catch (e) {
            console.error(`[ERROR] Failed to insert data for ${dateStr}: ${e.message}`);
        }
    };
    const stream = fs_1.default.createReadStream(filePath).pipe((0, csv_parser_1.default)());
    for await (const row of stream) {
        currentRowCount++;
        const rowDate = row['delivery_date'];
        if (!rowDate)
            continue;
        if (currentDeliveryDate !== rowDate) {
            if (currentDeliveryDate !== '') {
                // Process the previous group
                await processGroup(currentDeliveryDate, currentGroup);
            }
            // Start new group
            currentDeliveryDate = rowDate;
            currentGroup = [row];
        }
        else {
            currentGroup.push(row);
        }
    }
    // Process the final group
    if (currentGroup.length > 0) {
        await processGroup(currentDeliveryDate, currentGroup);
    }
    console.log(`Finished processing ${currentRowCount} rows.`);
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
