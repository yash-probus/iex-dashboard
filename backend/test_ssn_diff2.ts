import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorService } from './src/modules/savings-calculator/savings-calculator.service';
import { SavingsCalculatorNewService } from './src/modules/savings-calculator-new/savings-calculator-new.service';

const prisma = new PrismaClient();

async function run() {
  const oldEntry = await prisma.savingsCalculatorEntry.findFirst({ where: { clientName: { contains: 'SSN' } } });
  const newEntry = await prisma.savingsCalculatorNewEntry.findFirst({ where: { clientName: { contains: 'SSN' } } });

  console.log("Old Client:", oldEntry?.clientName, "ID:", oldEntry?.id);
  console.log("New Client:", newEntry?.clientName, "ID:", newEntry?.id);

  if (oldEntry) {
    const months = Object.keys(oldEntry.todConsumptions as any).filter(m => m.includes('-'));
    const month = months[months.length - 1]; // Use latest month
    const oldRes = await SavingsCalculatorService.calculateMarketDecision(oldEntry.id, month);
    console.log("--- OLD CALC RESULTS (" + month + ") ---");
    console.log("totalBaselineCost:", oldRes.totalBaselineCost);
    console.log("totalLandedExchangeCost:", oldRes.totalLandedExchangeCost);
    console.log("netSavings:", oldRes.totalSavings);
    console.log("totalMarketEnergyKwh:", oldRes.totalMarketEnergyKwh);
  }
  
  if (newEntry) {
    const months = Object.keys(newEntry.todConsumptions as any).filter(m => m.includes('-') && !m.startsWith('_'));
    const month = months[months.length - 1]; // Use latest month
    const newRes = await SavingsCalculatorNewService.calculateMarketDecision(newEntry.id, month);
    console.log("--- NEW CALC RESULTS (" + month + ") ---");
    console.log("fullBaselineDiscomCost:", newRes.fullBaselineDiscomCost);
    console.log("totalBaselineCost (raw):", (newRes as any).totalBaselineCost);
    console.log("totalLandedExchangeCost:", newRes.totalLandedExchangeCost);
    console.log("totalDiscomAfterProlt:", newRes.totalDiscomAfterProlt);
    console.log("grossSavings:", newRes.grossSavings);
    console.log("netSavings:", newRes.totalSavings);
    console.log("totalMarketEnergyKwh:", newRes.totalMarketEnergyKwh);
    console.log("totalEnergyKwh:", newRes.totalEnergyKwh);
    console.log("oldOaSurcharges (sum):", 
      newRes.oaDetailed.totals.cssCharge + 
      newRes.oaDetailed.totals.rpoCharge + 
      newRes.oaDetailed.totals.pocCharge + 
      newRes.oaDetailed.totals.stuCharge + 
      newRes.oaDetailed.totals.dcCharge + 
      newRes.oaDetailed.totals.iexFee
    );
  }
  process.exit(0);
}

run().catch(console.error);
