const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const id = '66d1cf98f02f83c180da1d0d'; // The ID in URL
  const entry = await prisma.traderPerformanceEntry.findUnique({
    where: { id }
  });
  
  if (!entry) {
    console.log("Entry not found in Postgres");
    process.exit(1);
  }
  
  const todConsumptions = entry.todConsumptions || {};
  if (!todConsumptions['2026-08']) {
    console.log("2026-08 not found in todConsumptions");
    process.exit(1);
  }
  
  const parsedData = JSON.parse(fs.readFileSync(path.join(__dirname, '../parsed_pdfs.json')));
  todConsumptions['2026-08'].traderReports = parsedData;
  
  await prisma.traderPerformanceEntry.update({
    where: { id },
    data: {
      todConsumptions: todConsumptions
    }
  });
  console.log("Successfully updated traderReports into Postgres using Prisma!");
  
  process.exit(0);
}
run();
