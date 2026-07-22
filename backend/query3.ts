import { SavingsCalculatorService } from './src/modules/savings-calculator/savings-calculator.service';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.savingsCalculatorEntry.findMany({ where: { discom: 'NPCL' } });
  if (entries.length > 0) {
    const entry = entries[entries.length - 1];
    console.log('Using entry:', entry.id);
    const result = await SavingsCalculatorService.calculateMarketDecision(entry.id, '2026-11');
    const firstSlot = result.slotsData[0];
    console.log('First slot losses:', {
      istsLoss: firstSlot.istsLoss,
      stuLoss: firstSlot.stuLoss,
      wheelingLoss: firstSlot.wheelingLoss
    });
  } else {
    console.log('No NPCL entries found');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
