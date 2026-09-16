const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { execSync } = require('child_process');
execSync('npx tsc', {cwd: path.join(__dirname, '../')});
const { TraderPerformanceService } = require('../dist/modules/trader-performance/trader-performance.service.js');

async function run() {
  const entries = await prisma.traderPerformanceEntry.findMany({
    where: {}
  });
  
  for (const e of entries) {
    if (e.todConsumptions && e.todConsumptions['2026-08']) {
      const tc = e.todConsumptions['2026-08'];
      if (tc.traderReports && Object.keys(tc.traderReports).length > 0) {
        console.log("Testing entry:", e.id);
        const result = await TraderPerformanceService.calculateMarketDecision(e.id, '2026-08', undefined);
        console.log("  exactTraderMarketEnergy:", result.totalTraderMarketEnergy);
        console.log("  exactTraderLandedCost:", result.totalTraderLandedCost);
      }
    }
  }
  process.exit(0);
}
run();
