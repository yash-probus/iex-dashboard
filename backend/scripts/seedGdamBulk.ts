import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '../../gdam_blocks.csv'); // The user's file is at the workspace root
  
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
        where: { market: 'GDAM', deliveryDate }
      });

      if (existing) {
        console.log(`[SKIP] Dataset for ${dateStr} already exists. Skipping ${rows.length} rows.`);
        return;
      }

      // 2. Create Dataset
      const dataset = await prisma.dataset.create({
        data: {
          market: 'GDAM',
          deliveryDate,
          status: 'ACTIVE',
          fileName: 'gdam_blocks.csv'
        }
      });

      // 3. Prepare records
      const gdamRecords = rows.map((row, index) => {
        // "Time Block" is like "00:00 - 00:15". We want the start time.
        const timeBlockStr = row['Time Block'] || '';
        const intervalTime = timeBlockStr.split(' ')[0] || '00:00';

        return {
          datasetId: dataset.id,
          intervalNumber: index + 1,
          intervalTime: intervalTime,
          purchaseBid: parseFloat(row['Purchase Bid (MW)']) || 0,
          sellBidTotal: parseFloat(row['Sell Bid (MW)']) || 0,
          sellBidSolar: parseFloat(row['Sell Bid (MW).1']) || 0,
          sellBidNonSolar: parseFloat(row['Sell Bid (MW).2']) || 0,
          sellBidHydro: parseFloat(row['Sell Bid (MW).3']) || 0,
          mcvTotal: parseFloat(row['MCV (MW)']) || 0,
          mcvSolar: parseFloat(row['MCV (MW).1']) || 0,
          mcvNonSolar: parseFloat(row['MCV (MW).2']) || 0,
          mcvHydro: parseFloat(row['MCV (MW).3']) || 0,
          fsvTotal: parseFloat(row['Final Scheduled Volume (MW)']) || 0,
          fsvSolar: parseFloat(row['Final Scheduled Volume (MW).1']) || 0,
          fsvNonSolar: parseFloat(row['Final Scheduled Volume (MW).2']) || 0,
          fsvHydro: parseFloat(row['Final Scheduled Volume (MW).3']) || 0,
          mcp: parseFloat(row['MCP (Rs/MWh)']) || 0,
        };
      });

      // 4. Insert
      await prisma.gdamRecord.createMany({
        data: gdamRecords
      });

      console.log(`[SUCCESS] Inserted ${gdamRecords.length} records for ${dateStr}`);
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
