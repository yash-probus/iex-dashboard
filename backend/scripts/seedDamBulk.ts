import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '../../dam_blocks.csv'); // The user's file is at the workspace root
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Starting bulk seed from ${filePath}`);

  let currentRowCount = 0;
  let currentGroup: any[] = [];
  let currentDeliveryDate = '';

  const processGroup = async (dateStr: string, rows: any[]) => {
    if (rows.length === 0) return;

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
    } catch (e: any) {
      console.error(`[ERROR] Failed to insert data for ${dateStr}: ${e.message}`);
    }
  };

  const stream = fs.createReadStream(filePath).pipe(csv());

  for await (const row of stream) {
    currentRowCount++;
    const rowDate = row['delivery_date'];

    if (!rowDate) continue;

    if (currentDeliveryDate !== rowDate) {
      if (currentDeliveryDate !== '') {
        // Process the previous group
        await processGroup(currentDeliveryDate, currentGroup);
      }
      // Start new group
      currentDeliveryDate = rowDate;
      currentGroup = [row];
    } else {
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
