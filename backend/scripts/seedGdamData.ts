import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface GdamRow {
  date: string;
  hour: number;
  timeBlock: string;
  purchaseBid: number;
  mcp: number;
  sellBidTotal: number;
  sellBidSolar: number;
  sellBidNonSolar: number;
  sellBidHydro: number;
  mcvTotal: number;
  mcvSolar: number;
  mcvNonSolar: number;
  mcvHydro: number;
  fsvTotal: number;
  fsvSolar: number;
  fsvNonSolar: number;
  fsvHydro: number;
  deliveryDate: string;
}

function parseDate(dateStr: string): string {
  // Input: DD-MM-YYYY, Output: YYYY-MM-DD
  const parts = dateStr.split('-');
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function formatTimeBlock(tb: string): string {
  // Input: "00:00 - 00:15", Output: "00:00-00:15"
  return tb.replace(/\s*-\s*/, '-');
}

async function main() {
  const csvPath = path.resolve(__dirname, '../../gdam_blocks (1).csv');
  console.log(`Reading CSV from: ${csvPath}`);

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  // Skip header
  const dataLines = lines.slice(1);
  console.log(`Total data rows: ${dataLines.length}`);

  // CSV columns:
  // 0: Date, 1: Hour, 2: Time Block, 3: Purchase Bid (MW), 4: MCP (Rs/MWh),
  // 5: timestamp, 6: delivery_date, 7: scraped_at_UTC, 8: market,
  // 9: Sell Bid Total, 10: Sell Bid Solar, 11: Sell Bid NonSolar, 12: Sell Bid Hydro,
  // 13: MCV Total, 14: MCV Solar, 15: MCV NonSolar, 16: MCV Hydro,
  // 17: FSV Total, 18: FSV Solar, 19: FSV NonSolar, 20: FSV Hydro

  const grouped = new Map<string, GdamRow[]>();

  for (const line of dataLines) {
    const cols = line.split(',');
    if (cols.length < 21) continue;

    const deliveryDate = parseDate(cols[0].trim());
    const row: GdamRow = {
      date: cols[0].trim(),
      hour: parseFloat(cols[1]),
      timeBlock: formatTimeBlock(cols[2].trim()),
      purchaseBid: parseFloat(cols[3]) || 0,
      mcp: parseFloat(cols[4]) || 0,
      sellBidTotal: parseFloat(cols[9]) || 0,
      sellBidSolar: parseFloat(cols[10]) || 0,
      sellBidNonSolar: parseFloat(cols[11]) || 0,
      sellBidHydro: parseFloat(cols[12]) || 0,
      mcvTotal: parseFloat(cols[13]) || 0,
      mcvSolar: parseFloat(cols[14]) || 0,
      mcvNonSolar: parseFloat(cols[15]) || 0,
      mcvHydro: parseFloat(cols[16]) || 0,
      fsvTotal: parseFloat(cols[17]) || 0,
      fsvSolar: parseFloat(cols[18]) || 0,
      fsvNonSolar: parseFloat(cols[19]) || 0,
      fsvHydro: parseFloat(cols[20]) || 0,
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
        market: 'GDAM',
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
        market: 'GDAM',
        deliveryDate,
        fileName: `gdam_blocks_${dateStr}.csv`,
        status: 'ACTIVE',
      }
    });

    // Create GDAM records
    const recordData = rows.map((row, idx) => ({
      datasetId: dataset.id,
      intervalNumber: idx + 1,
      intervalTime: row.timeBlock,
      purchaseBid: row.purchaseBid,
      sellBidTotal: row.sellBidTotal,
      sellBidSolar: row.sellBidSolar,
      sellBidNonSolar: row.sellBidNonSolar,
      sellBidHydro: row.sellBidHydro,
      mcvTotal: row.mcvTotal,
      mcvSolar: row.mcvSolar,
      mcvNonSolar: row.mcvNonSolar,
      mcvHydro: row.mcvHydro,
      fsvTotal: row.fsvTotal,
      fsvSolar: row.fsvSolar,
      fsvNonSolar: row.fsvNonSolar,
      fsvHydro: row.fsvHydro,
      mcp: row.mcp,
    }));

    await prisma.gdamRecord.createMany({
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
