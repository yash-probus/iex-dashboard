import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { TraderPerformanceService } from './backend/src/modules/trader-performance/trader-performance.service';
import { SavingsCalculatorService } from './backend/src/modules/savings-calculator/savings-calculator.service';

async function test() {
  const tEntry = await prisma.traderPerformanceEntry.findFirst({
    where: { clientName: { not: '' } }
  });
  
  if (!tEntry) return console.log("No trader entry found");
  
  // Just calculate for month 26-04 if present
  const month = Object.keys(tEntry.todConsumptions as any)[0];
  if (!month) return console.log("No months");

  const r1 = await TraderPerformanceService.calculateMarketDecision(tEntry.id, month);
  console.log("TraderPerformance:", JSON.stringify(r1, null, 2));

  // Now create a duplicate entry in savingsCalculatorEntry
  const sEntry = await prisma.savingsCalculatorEntry.create({
    data: {
      clientName: "Test_" + tEntry.clientName,
      industryName: tEntry.industryName || '',
      stateCode: tEntry.stateCode || '',
      discom: tEntry.discom || '',
      consumerCategory: tEntry.consumerCategory || '',
      voltageLevel: tEntry.voltageLevel || '',
      sanctionedLoadKw: tEntry.sanctionedLoadKw,
      powerFactor: tEntry.powerFactor,
      todConsumptions: tEntry.todConsumptions as any,
      proltMargin: tEntry.proltMargin,
      traderMargin: tEntry.traderMargin,
      meteringCharges: tEntry.meteringCharges,
      consultancyFee: tEntry.consultancyFee,
      probusPlatformFee: tEntry.probusPlatformFee,
      applyElectricityDuty: tEntry.applyElectricityDuty,
    }
  });

  const r2 = await SavingsCalculatorService.calculateMarketDecision(sEntry.id, month);
  console.log("SavingsCalculator:", JSON.stringify(r2, null, 2));

  await prisma.savingsCalculatorEntry.delete({ where: { id: sEntry.id } });
}
test().catch(console.error).finally(() => prisma.$disconnect());
