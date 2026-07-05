import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface RtmRow {
  date: string;
  hour: number;
  sessionId: number;
  timeBlock: string;
  purchaseBid: number;
  sellBid: number;
  mcv: number;
  fsv: number;
  mcp: number;
  deliveryDate: string; // YYYY-MM-DD
}

function parseDate(dateStr: string): string {
  // Input: DD-MM-YYYY, Output: YYYY-MM-DD
  const parts = dateStr.split('-');
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

async function main() {
  const csvPath = path.resolve(__dirname, '../../rtm_blocks.csv');
  console.log(`Reading CSV from: ${csvPath}`);

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  console.log(`Total data rows: ${dataLines.length}`);

  // Group rows by delivery_date
  const grouped = new Map<string, RtmRow[]>();

  for (const line of dataLines) {
    const cols = line.split(',');
    if (cols.length < 9) continue;

    const deliveryDate = parseDate(cols[0].trim());
    const row: RtmRow = {
      date: cols[0].trim(),
      hour: parseFloat(cols[1]),
      sessionId: parseFloat(cols[2]),
      timeBlock: cols[3].trim(),
      purchaseBid: parseFloat(cols[4]),
      sellBid: parseFloat(cols[5]),
      mcv: parseFloat(cols[6]),
      fsv: parseFloat(cols[7]),
      mcp: parseFloat(cols[8]),
      deliveryDate,
    };

    if (!grouped.has(deliveryDate)) {
      grouped.set(deliveryDate, []);
    }
    grouped.get(deliveryDate)!.push(row);
  }

  const dates = Array.from(grouped.keys()).sort();
  console.log(`Unique delivery dates: ${dates.length}`);
  console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);

  let createdDatasets = 0;
  let createdRecords = 0;
  let skippedDates = 0;

  for (const dateStr of dates) {
    const rows = grouped.get(dateStr)!;
    const deliveryDate = new Date(dateStr + 'T00:00:00.000Z');

    // Check if dataset already exists for this date
    const existing = await prisma.dataset.findFirst({
      where: {
        market: 'RTM',
        deliveryDate,
      }
    });

    if (existing) {
      skippedDates++;
      continue;
    }

    // Sort rows by timeBlock to assign interval numbers
    rows.sort((a, b) => {
      const aStart = a.timeBlock.split('-')[0];
      const bStart = b.timeBlock.split('-')[0];
      return aStart.localeCompare(bStart);
    });

    // Create dataset
    const dataset = await prisma.dataset.create({
      data: {
        market: 'RTM',
        deliveryDate,
        fileName: `rtm_blocks_${dateStr}.csv`,
        status: 'ACTIVE',
      }
    });

    // Create RTM records
    const recordData = rows.map((row, idx) => ({
      datasetId: dataset.id,
      intervalNumber: idx + 1,
      intervalTime: row.timeBlock,
      sessionId: String(Math.floor(row.sessionId)),
      purchaseBid: row.purchaseBid,
      sellBid: row.sellBid,
      mcv: row.mcv,
      fsv: row.fsv,
      mcp: row.mcp,
    }));

    await prisma.rtmRecord.createMany({
      data: recordData,
    });

    createdDatasets++;
    createdRecords += recordData.length;

    if (createdDatasets % 50 === 0) {
      console.log(`  Progress: ${createdDatasets}/${dates.length} dates processed, ${createdRecords} records created`);
    }
  }

  console.log(`\nDone!`);
  console.log(`  Datasets created: ${createdDatasets}`);
  console.log(`  Records created: ${createdRecords}`);
  console.log(`  Dates skipped (already exist): ${skippedDates}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
