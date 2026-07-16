import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const oneYearAgoDate = new Date();
  oneYearAgoDate.setFullYear(oneYearAgoDate.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgoDate.toISOString().split('T')[0];

  console.log(`Exporting data from ${oneYearAgoStr} onwards...`);

  const downloadsDir = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads');
  
  // 1. Export Demand Data
  const demandCsvPath = path.join(downloadsDir, 'npp_demand_data_last_1_year.csv');
  const demandStream = fs.createWriteStream(demandCsvPath);
  demandStream.write('date,timeStr,demandMet,dataUpdatedAt,fetchedAt\n');

  console.log(`Fetching demand data...`);
  const demandData = await prisma.nppRawDemandData.findMany({
    where: { date: { gte: oneYearAgoStr } },
    orderBy: [{ date: 'asc' }, { timeStr: 'asc' }]
  });

  for (const row of demandData) {
    demandStream.write(`${row.date},${row.timeStr},${row.demandMet},${row.dataUpdatedAt || ''},${row.fetchedAt.toISOString()}\n`);
  }
  demandStream.end();
  console.log(`Demand data saved to: ${demandCsvPath} (${demandData.length} rows)`);

  // 2. Export Generation Data
  const genCsvPath = path.join(downloadsDir, 'npp_generation_data_last_1_year.csv');
  const genStream = fs.createWriteStream(genCsvPath);
  genStream.write('date,timeStr,thermal,gas,nuclear,hydro,wind,solar,dataUpdatedAt,fetchedAt\n');

  console.log(`Fetching generation data...`);
  const genData = await prisma.nppRawGenerationData.findMany({
    where: { date: { gte: oneYearAgoStr } },
    orderBy: [{ date: 'asc' }, { timeStr: 'asc' }]
  });

  for (const row of genData) {
    genStream.write(`${row.date},${row.timeStr},${row.thermal ?? ''},${row.gas ?? ''},${row.nuclear ?? ''},${row.hydro ?? ''},${row.wind ?? ''},${row.solar ?? ''},${row.dataUpdatedAt || ''},${row.fetchedAt.toISOString()}\n`);
  }
  genStream.end();
  console.log(`Generation data saved to: ${genCsvPath} (${genData.length} rows)`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
