import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const START_DATE = '2025-06-01';
const END_DATE = '2026-06-30';

function get15MinBucketsForDate(dateStr: string) {
  const buckets: { timeStr: string, timestampMs: number }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const timestampMs = new Date(`${dateStr}T${timeStr}:00+05:30`).getTime(); // IST
      buckets.push({ timeStr, timestampMs });
    }
  }
  return buckets;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

async function exportData() {
  console.log(`Querying NppRawDemandData from ${START_DATE} to ${END_DATE}...`);
  
  const rawData = await prisma.nppRawDemandData.findMany({
    where: {
      date: {
        gte: START_DATE,
        lte: END_DATE
      }
    },
    orderBy: [
      { date: 'asc' },
      { dataUpdatedAt: 'asc' }
    ]
  });

  console.log(`Found ${rawData.length} raw records.`);

  // Group raw data by date
  const dataByDate: Record<string, typeof rawData> = {};
  for (const row of rawData) {
    if (!dataByDate[row.date]) dataByDate[row.date] = [];
    dataByDate[row.date].push(row);
  }

  const csvRows: string[] = ['Date,Time Block,Demand Met (MW)'];
  let missingBlocks = 0;

  let current = START_DATE;
  let lastDemand = 0;

  while (current <= END_DATE) {
    const buckets = get15MinBucketsForDate(current);
    const dayRecords = dataByDate[current] || [];

    for (let i = 0; i < buckets.length; i++) {
      const bucket = buckets[i];
      const nextBucketMs = i < buckets.length - 1 
        ? buckets[i + 1].timestampMs 
        : buckets[i].timestampMs + 15 * 60 * 1000;

      // Find records that fall into this 15-min window
      const recordsInBucket = dayRecords.filter(r => {
        if (!r.dataUpdatedAt) return false;
        const ms = new Date(r.dataUpdatedAt).getTime();
        return ms >= bucket.timestampMs && ms < nextBucketMs;
      });

      let demandToUse = lastDemand;

      if (recordsInBucket.length > 0) {
        // Average demand in this bucket
        const sum = recordsInBucket.reduce((acc, r) => acc + r.demandMet, 0);
        demandToUse = Math.round(sum / recordsInBucket.length);
        lastDemand = demandToUse;
      } else {
        // If no records in this bucket, use the closest record in the day, or carry forward
        // For simplicity and to fill gaps, we carry forward the last seen demand
        missingBlocks++;
      }

      // Format Time Block as "00:00 - 00:15"
      const endMins = (new Date(nextBucketMs).getMinutes()).toString().padStart(2, '0');
      const endHrs = (new Date(nextBucketMs).getHours()).toString().padStart(2, '0');
      const endTimeStr = `${endHrs}:${endMins}`;
      const timeBlockStr = `${bucket.timeStr} - ${endTimeStr}`;

      // Convert Date format to DD-MM-YYYY to match IEX style
      const [year, month, day] = current.split('-');
      const formattedDate = `${day}-${month}-${year}`;

      csvRows.push(`${formattedDate},${timeBlockStr},${demandToUse}`);
    }

    current = addDays(current, 1);
  }

  const outPath = path.resolve(__dirname, '../../npp_demand_15min_jun25_jun26.csv');
  fs.writeFileSync(outPath, csvRows.join('\n'));
  
  console.log(`Exported exactly ${csvRows.length - 1} adjusted 15-min blocks to ${outPath}`);
  console.log(`Interpolated ${missingBlocks} missing blocks using carry-forward strategy.`);
}

exportData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
