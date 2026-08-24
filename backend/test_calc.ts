import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorService } from './src/modules/savings-calculator/savings-calculator.service';
import { SavingsCalculatorNewService } from './src/modules/savings-calculator-new/savings-calculator-new.service';

const prisma = new PrismaClient();

async function run() {
  const c = await prisma.savingsCalculatorEntry.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!c) {
    console.log("No client found");
    return;
  }
  
  console.log(`Testing Client: ${c.clientName} (${c.id})`);

  try {
    const oldRes = await SavingsCalculatorService.calculateMarketDecisionAllMonths(c.id);
    const newRes = await SavingsCalculatorNewService.calculateMarketDecisionAllMonths(c.id);

    console.log('OLD KEYS:', Object.keys(oldRes));
    console.log('NEW KEYS:', Object.keys(newRes));

    console.log('\n--- TOTAL LANDED EXCHANGE COST ---');
    console.log('OLD:', oldRes.totalLandedExchangeCost);
    console.log('NEW:', newRes.totalLandedExchangeCost);

    console.log('\n--- TOTAL DISCOM AFTER PROLT ---');
    console.log('OLD:', oldRes.totalDiscomAfterProlt);
    console.log('NEW:', newRes.totalDiscomAfterProlt);

    console.log('\n--- OA SURCHARGES (CSS, RPO, etc) ---');
    console.log('OLD CSS:', oldRes.oaDetailed?.totals?.cssCharge);
    console.log('NEW CSS:', newRes.oaDetailed?.totals?.cssCharge);

    console.log('\n--- BASELINE ---');
    console.log('OLD Baseline:', oldRes.fullBaselineDiscomCost);
    console.log('NEW Baseline:', newRes.fullBaselineDiscomCost);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
