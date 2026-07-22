import { SavingsCalculatorService } from './src/modules/savings-calculator/savings-calculator.service';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.savingsCalculatorEntry.findMany();
  console.log('Total entries:', entries.length);
  const npclEntry = entries.find(e => e.discom === 'NPCL');
  if (npclEntry) {
    console.log('Using entry:', npclEntry.id);
    const result = await SavingsCalculatorService.calculateMarketDecision(npclEntry.id, '2026-11');
    const firstSlot = result.slotsData[0];
    console.log('First slot losses:', {
      istsLoss: firstSlot.istsLoss,
      stuLoss: firstSlot.stuLoss,
      wheelingLoss: firstSlot.wheelingLoss
    });
  } else {
    console.log('Still no NPCL entries found. Here are the discoms:');
    entries.forEach(e => console.log(e.discom));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
