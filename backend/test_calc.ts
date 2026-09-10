import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorNewService } from './src/modules/savings-calculator-new/savings-calculator-new.service';

const prisma = new PrismaClient();

async function main() {
  const entry = await prisma.savingsCalculatorNewEntry.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  
  if (!entry) {
    console.log("No entry found");
    return;
  }
  
  const result: any = await SavingsCalculatorNewService.calculateSavings(entry.id);
  const firstMonth = result.sortedMonthlyList[0];
  console.log(firstMonth.breakdown.map((r: any) => ({
    tod: r.todSlab,
    discomRate: r.discomRate
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
