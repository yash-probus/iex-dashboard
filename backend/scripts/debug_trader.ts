import { TraderPerformanceService } from './src/modules/trader-performance/trader-performance.service';
import { getFlooredMaxEnergyPerSlot } from './src/modules/trader-performance/trader-performance.service';
import prisma from './src/config/prisma';

async function run() {
  console.log("Fetching entry...");
  const entry = await TraderPerformanceService.getById('66d1cf98f02f83c180da1d0d');
  if (!entry) {
    console.log("No entry found!");
    process.exit(1);
  }
  const result = await TraderPerformanceService.calculateMarketDecision('66d1cf98f02f83c180da1d0d', '2026-08', undefined);
  console.log("=== RESULTS ===");
  console.log("Total Baseline Cost:", result.totalBaselineCost);
  console.log("Total Landed Exchange Cost:", result.totalLandedExchangeCost);
  console.log("Total Prolt Margin Cost:", result.totalSavings); // Wait, result doesn't export prolt directly, let's just see final savings
  console.log("Final Net Savings vs Discom (Total Savings):", result.totalSavings);
  console.log("Total Trader Landed Cost:", result.totalTraderLandedCost);
  console.log("Trader Market Energy (kWh):", result.totalTraderMarketEnergy);
  
  process.exit(0);
}
run();
