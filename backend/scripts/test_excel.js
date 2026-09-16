const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { TraderPerformanceService } = require('../dist/modules/trader-performance/trader-performance.service.js');
const { TraderPerformanceExportService } = require('../dist/modules/trader-performance/trader-performance.export.js');

async function run() {
  const id = '66d1cf98f02f83c180da1d0d'; // test id
  const buffer = await TraderPerformanceExportService.exportActualTraderToExcel(id, '2026-08', undefined);
  fs.writeFileSync('test_actual_trader.xlsx', buffer);
  console.log("Excel generated successfully. File size:", buffer.length);
  process.exit(0);
}
run();
