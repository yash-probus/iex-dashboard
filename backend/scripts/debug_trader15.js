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
  if (entry.todConsumptions?.['2026-08']) {
      const tc = entry.todConsumptions['2026-08'];
      if (tc.traderReports?.data) {
          Object.entries(tc.traderReports.data).forEach(([key, report]) => {
              console.log(`Key: ${key} -> delivery_date: ${report.delivery_date}`);
          });
      }
  }
  process.exit(0);
}
run();
