import { SavingsCalculatorService } from '../src/modules/savings-calculator/savings-calculator.service';
import prisma from '../src/config/prisma';

async function main() {
  const latestEntry = await prisma.savingsCalculatorEntry.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  
  if (!latestEntry) return console.log('No entries');
  
  const result = await SavingsCalculatorService.calculateMarketDecision(
    latestEntry.id, '2026-01'
  );
  
  console.log('Peak Demand Info:', latestEntry.todConsumptions);
  console.log('Demand Charge:', result.demandCharge);
  console.log('ED:', result.electricityDuty);
  console.log('Breakdown:', JSON.stringify(result.oaDetailed.breakdown, null, 2));
}
main();
