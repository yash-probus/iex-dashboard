import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorNewService } from './backend/src/modules/savings-calculator-new/savings-calculator-new.service';

const prisma = new PrismaClient();

async function test() {
  const entry = await prisma.savingsCalculatorNewEntry.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (!entry) return console.log('No entries');
  console.log('Testing entry:', entry.id);
  const overview = await SavingsCalculatorNewService.getClientOverview(entry.id);
  console.log(JSON.stringify(overview, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
