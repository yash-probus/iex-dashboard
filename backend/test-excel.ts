import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorExportService } from './src/modules/savings-calculator/savings-calculator.export';
import fs from 'fs';

async function run() {
  const prisma = new PrismaClient();
  const entry = await prisma.savingsCalculatorEntry.findFirst({
    where: { todConsumptions: { not: {} } }
  });
  
  if (!entry) return console.log('No entry found');
  
  const normalBuffer = await SavingsCalculatorExportService.exportToExcel(entry.id, 'all', undefined);
  fs.writeFileSync('normal.xlsx', normalBuffer);
  
  const shiftedBuffer = await SavingsCalculatorExportService.exportDemandShiftToExcel(entry.id, 'all', undefined);
  fs.writeFileSync('shifted.xlsx', shiftedBuffer);
  
  console.log('Normal length:', normalBuffer.length);
  console.log('Shifted length:', shiftedBuffer.length);
}

run().catch(console.error).finally(() => process.exit(0));
