import { SavingsCalculatorService } from './src/modules/savings-calculator/savings-calculator.service';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.savingsCalculatorEntry.findMany();
  const entry = entries[entries.length - 1]; // e1a287dd-1464-4f73-9528-6d842cb1e568 (MVVNL)
  
  // Clone it to simulate NPCL
  const mockNpclEntry = { ...entry, discom: 'NPCL' };
  
  // We need to override getEntryOrVersion for this test
  const originalGetEntry = SavingsCalculatorService.getEntryOrVersion;
  SavingsCalculatorService.getEntryOrVersion = async () => mockNpclEntry as any;
  
  const result = await SavingsCalculatorService.calculateMarketDecision(entry.id, '2026-11');
  const firstSlot = result.slotsData[0];
  console.log('Mocked NPCL First slot losses:', {
    istsLoss: firstSlot.istsLoss,
    stuLoss: firstSlot.stuLoss,
    wheelingLoss: firstSlot.wheelingLoss
  });
  
  SavingsCalculatorService.getEntryOrVersion = originalGetEntry;
}
main().catch(console.error).finally(() => prisma.$disconnect());
