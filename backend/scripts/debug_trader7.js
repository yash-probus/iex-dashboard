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
  const traderReports = entry.monthConsumptions?.traderReports;
  console.log("traderReports keys:", Object.keys(traderReports || {}));
  if (traderReports?.data) {
    const keys = Object.keys(traderReports.data).slice(0, 3);
    console.log("first 3 data keys:", keys);
    keys.forEach(k => {
      console.log(`Key ${k} trades length:`, traderReports.data[k].trades?.length);
      console.log(`Key ${k} delivery_date:`, traderReports.data[k].delivery_date);
    });
  }
  process.exit(0);
}
run();
