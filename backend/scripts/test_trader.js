const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// We'll require the typescript compiled service since ts-node failed
const { execSync } = require('child_process');
execSync('npx tsc', {cwd: path.join(__dirname, '../')});

const { TraderPerformanceService } = require('../dist/modules/trader-performance/trader-performance.service.js');

async function run() {
  const result = await TraderPerformanceService.calculateMarketDecision('66d1cf98f02f83c180da1d0d', '2026-08', undefined);
  console.log("Total Baseline Cost:", result.totalBaselineCost);
  console.log("Total Trader Landed Cost:", result.totalTraderLandedCost);
  console.log("Net Savings vs Discom (Trader):", result.totalBaselineCost - result.totalTraderLandedCost);
  process.exit(0);
}
run();
