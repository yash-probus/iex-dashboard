import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorNewService } from './src/modules/savings-calculator-new/savings-calculator-new.service';

const prisma = new PrismaClient();

async function run() {
  const entry = await prisma.savingsCalculatorEntry.findFirst({
    where: { clientName: { contains: 'SSN' } }
  });
  if (!entry) {
    console.log("No SSN entry found");
    return;
  }
  console.log("Found Entry ID:", entry.id);
  const result = await SavingsCalculatorNewService.calculateMarketDecision(entry.id, '2025-10');
  console.log({
    totalLandedExchangeCost: result.totalLandedExchangeCost,
    totalDiscomAfterProlt: result.totalDiscomAfterProlt,
    fppaAfterOAVal: result.fppaChargeAfterOA,
    calculatedDemandCharge: result.demandCharge,
    electricityDutyAfterOAVal: result.electricityDutyAfterOA,
    traderMarginCost: result.oaDetailed.totals.traderMargin,
    consultancyFeeVal: result.oaDetailed.totals.consultancyFee,
    probusPlatformFeeVal: result.oaDetailed.totals.probusPlatformFee,
    meteringCharges: (result.oaDetailed.totals as any).meteringCharges,
    dailyFixedOverhead: result.oaDetailed.dailyFixedOverhead,
    bidApplicationFees: result.oaDetailed.bidApplicationFees,
    proltMarginCost: result.oaDetailed.totals.proltMarginCost,
    totalOptimizedCost: result.totalOptimizedCost,
    fullBaselineDiscomCost: result.fullBaselineDiscomCost
  });
}
run().catch(console.error).finally(() => prisma.$disconnect());
