import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorService } from '../src/modules/savings-calculator/savings-calculator.service';

const prisma = new PrismaClient();

async function test() {
  const entry = await prisma.savingsCalculatorEntry.findFirst({
    where: { clientName: { contains: 'Oriental' } }
  });
  if (!entry) throw new Error('not found');
  console.log('Entry:', entry.id);
  const result: any = await SavingsCalculatorService.calculateSavings(entry.id, '2025-04');
  console.log('Result TOD slabs:', Object.keys(result.todGroups));
}

test().catch(console.error).finally(() => prisma.$disconnect());
