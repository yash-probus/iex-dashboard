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
  const traderReports = m?.traderReports;
  console.log("traderReports type:", typeof traderReports, "isArray:", Array.isArray(traderReports));
  
  if (traderReports?.data) {
    console.log("data keys length:", Object.keys(traderReports.data).length);
    const keys = Object.keys(traderReports.data).slice(0, 3);
    console.log("first 3 data keys:", keys);
    keys.forEach(k => {
      console.log(`Key ${k} trades length:`, traderReports.data[k].trades?.length);
      console.log(`Key ${k} delivery_date:`, traderReports.data[k].delivery_date);
    });
  } else if (Array.isArray(traderReports)) {
     console.log("first 3 elements:", JSON.stringify(traderReports.slice(0, 3)).substring(0, 500));
  }
  process.exit(0);
}
run();
