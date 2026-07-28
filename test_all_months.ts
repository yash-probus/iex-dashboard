import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorService } from './backend/src/modules/savings-calculator/savings-calculator.service';

const prisma = new PrismaClient();

async function test() {
  const entry = await prisma.savingsCalculatorEntry.findFirst({
    where: { clientName: { not: null } }
  });
  if (!entry) return console.log('No entry found');
  console.log('Testing entry:', entry.id);
  const result = await SavingsCalculatorService.calculateMarketDecisionAllMonths(entry.id);
  console.log('totalSavings for all:', result.totalSavings);
  
  const todConsumptions = entry.todConsumptions as any;
  for (const month of Object.keys(todConsumptions)) {
    const res = await SavingsCalculatorService.calculateMarketDecision(entry.id, month);
    console.log(`totalSavings for ${month}:`, res.totalSavings);
  }
}
test().catch(console.error).finally(() => prisma.$disconnect());
