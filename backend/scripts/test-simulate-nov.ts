import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorService } from '../src/modules/savings-calculator/savings-calculator.service';

async function main() {
  const result = await SavingsCalculatorService.calculateMarketDecision('426ee4a2-eff4-4ccf-8b1e-967d7e0cdd2e', '2026-07');
  console.log("Total Baseline Cost:", result.totalBaselineCost);
  console.log("Demand Charge:", result.demandCharge);
  console.log("ED:", result.electricityDuty);
}
main().catch(console.error);
