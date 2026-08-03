import { SavingsCalculatorService } from '../modules/savings-calculator/savings-calculator.service';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const entryId = '6f8931eb-378a-490b-a213-0546504ad486';
    const month = '2026-05';
    
    console.log('Running calculateMarketDecision...');
    const result = await SavingsCalculatorService.calculateMarketDecision(entryId, month);
    
    console.log('Result FPPA Percent:', result.fppaPercent);
    console.log('Result totalBaselineCost:', result.totalBaselineCost);
    console.log('Result demandCharge:', result.demandCharge);
    console.log('Result electricityDuty:', result.electricityDuty);

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
