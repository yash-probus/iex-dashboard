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
  console.log("todConsumptions keys:", Object.keys(entry.todConsumptions || {}));
  if (entry.todConsumptions?.['2026-08']) {
      const tc = entry.todConsumptions['2026-08'];
      console.log("keys for 2026-08:", Object.keys(tc));
      if (tc.traderReports?.data) {
          console.log("traderReports keys length:", Object.keys(tc.traderReports.data).length);
          const firstKey = Object.keys(tc.traderReports.data)[0];
          console.log("firstKey:", firstKey);
          console.log("delivery_date:", tc.traderReports.data[firstKey].delivery_date);
          console.log("trades:", tc.traderReports.data[firstKey].trades?.slice(0, 2));
      }
  }
  process.exit(0);
}
run();
