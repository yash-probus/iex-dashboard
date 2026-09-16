const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const entry = await prisma.traderPerformanceEntry.findUnique({
    where: { id: '66d1cf98f02f83c180da1d0d' }
  });
  let m = entry.monthConsumptions;
  if (Array.isArray(m)) {
    m = m.find(x => x.month === '2026-08');
  }
  console.log("m keys:", Object.keys(m || {}));
  process.exit(0);
}
run();
