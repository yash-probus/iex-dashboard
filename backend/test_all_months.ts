import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorService } from './src/modules/savings-calculator/savings-calculator.service';

const prisma = new PrismaClient();

async function test() {
  const entry = await prisma.savingsCalculatorEntry.findFirst({
    where: { clientName: { contains: "REC_Market" } }
  });
  if (!entry) {
    console.log('not found');
    return;
  }
  
  console.log('Testing entry:', entry.clientName);
  const result = await SavingsCalculatorService.calculateMarketDecisionAllMonths(entry.id);
  console.log('totalSavings for all:', result.totalSavings);
  
  const todConsumptions = entry.todConsumptions as any;
  if (todConsumptions) {
    for (const month of Object.keys(todConsumptions)) {
      const res = await SavingsCalculatorService.calculateMarketDecision(entry.id, month);
      console.log(`totalSavings for ${month}:`, res.totalSavings);
    }
  }
}
test().catch(console.error).finally(() => prisma.$disconnect());
