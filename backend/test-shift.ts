import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorService } from './src/modules/savings-calculator/savings-calculator.service';

async function run() {
  const prisma = new PrismaClient();
  const entry = await prisma.savingsCalculatorEntry.findFirst({
    where: { todConsumptions: { not: {} } }
  });
  
  if (!entry) return console.log('No entry found');
  
  const normal = await SavingsCalculatorService.calculateMarketDecision(entry.id, '2026-07', undefined, false);
  const shifted = await SavingsCalculatorService.calculateMarketDecision(entry.id, '2026-07', undefined, true);
  
  console.log('--- NORMAL ---');
  normal.todSummaries.forEach((t: any) => console.log(t.slabName, 'Energy:', t.totalEnergyKwh, 'Market:', t.marketEnergyKwh));
  
  console.log('--- SHIFTED ---');
  shifted.todSummaries.forEach((t: any) => console.log(t.slabName, 'Energy:', t.totalEnergyKwh, 'Market:', t.marketEnergyKwh));
}

run().catch(console.error).finally(() => process.exit(0));
