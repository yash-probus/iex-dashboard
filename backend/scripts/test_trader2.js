const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const id = '66d1cf98f02f83c180da1d0d';
  const entry = await prisma.traderPerformanceEntry.findUnique({
    where: { id }
  });
  console.log(Object.keys(entry.todConsumptions || {}));
  console.log(entry.todConsumptions['2026-08'] ? Object.keys(entry.todConsumptions['2026-08']) : 'no 2026-08');
  process.exit(0);
}
run();
