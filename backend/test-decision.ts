import { TraderPerformanceActualService } from './src/modules/trader-performance-actual/trader-performance-actual.service';

async function main() {
  const result = await TraderPerformanceActualService.calculateMarketDecision('2c0bb9b2-ee51-4187-8fa3-d71863c67cfa', '2026-08', 1);
  console.log("demandCharge:", result.demandCharge);
  console.log("demandAndFixedChargesApplied:", result.demandAndFixedChargesApplied);
  console.log("peakDemand:", result.peakDemand);
  console.log("demandChargeRate:", result.demandChargeRate);
}
main().catch(console.error);
