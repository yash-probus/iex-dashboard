const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { SavingsCalculatorService } = require('./src/modules/savings-calculator/savings-calculator.service');
const { SavingsCalculatorNewService } = require('./src/modules/savings-calculator-new/savings-calculator-new.service');

async function run() {
  const oldEntry = await prisma.savingsCalculatorEntry.findFirst({ where: { clientName: { contains: 'SSN' } } });
  const newEntry = await prisma.savingsCalculatorNewEntry.findFirst({ where: { clientName: { contains: 'SSN' } } });

  console.log("Old Entry ID:", oldEntry?.id);
  console.log("New Entry ID:", newEntry?.id);

  if (oldEntry) {
    const oldRes = await SavingsCalculatorService.calculateMarketDecision(oldEntry.id, '2026-05');
    console.log("--- OLD CALC RESULTS ---");
    console.log("totalBaselineCost:", oldRes.totalBaselineCost);
    console.log("totalLandedExchangeCost:", oldRes.totalLandedExchangeCost);
    console.log("netSavings:", oldRes.totalSavings);
    console.log("totalMarketEnergyKwh:", oldRes.totalMarketEnergyKwh);
    console.log("discomEnergy (from breakdown):", oldRes.oaDetailed?.breakdown.reduce((sum, s) => sum + s.discomUnits, 0));
  }
  
  if (newEntry) {
    const newRes = await SavingsCalculatorNewService.calculateMarketDecision(newEntry.id, '2026-05');
    console.log("--- NEW CALC RESULTS ---");
    console.log("fullBaselineDiscomCost:", newRes.fullBaselineDiscomCost);
    console.log("totalLandedExchangeCost:", newRes.totalLandedExchangeCost);
    console.log("totalDiscomAfterProlt:", newRes.totalDiscomAfterProlt);
    console.log("grossSavings:", newRes.grossSavings);
    console.log("netSavings:", newRes.totalSavings);
    console.log("totalMarketEnergyKwh:", newRes.totalMarketEnergyKwh);
    console.log("oldOaSurcharges (sum):", 
      newRes.oaDetailed.totals.cssCharge + 
      newRes.oaDetailed.totals.rpoCharge + 
      newRes.oaDetailed.totals.pocCharge + 
      newRes.oaDetailed.totals.stuCharge + 
      newRes.oaDetailed.totals.dcCharge + 
      newRes.oaDetailed.totals.iexFee
    );
    console.log("fees:", newRes.oaDetailed.dailyFixedOverhead + newRes.oaDetailed.bidApplicationFees);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
