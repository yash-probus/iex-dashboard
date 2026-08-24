const { PrismaClient } = require('@prisma/client');
const { SavingsCalculatorService } = require('./src/modules/savings-calculator/savings-calculator.service');
const { SavingsCalculatorNewService } = require('./src/modules/savings-calculator-new/savings-calculator-new.service');

const prisma = new PrismaClient();

async function run() {
  const c = await prisma.savingsCalculatorNewEntry.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!c) {
    console.log("No client found in NEW table");
    return;
  }
  
  console.log(`Testing Client (NEW table): ${c.clientName} (${c.id})`);

  try {
    const newRes = await SavingsCalculatorNewService.calculateMarketDecisionAllMonths(c.id);

    console.log('\n--- NEW ---');
    console.log('Gross:', newRes.grossSavings);
    console.log('Total:', newRes.totalSavings);
    console.log('OA Cost:', newRes.totalLandedExchangeCost);
    console.log('Discom After PROLT:', newRes.totalDiscomAfterProlt);
    console.log('Baseline:', newRes.totalBaselineCost);

    console.log('\n--- OA Detailed ---');
    console.log('New CSS:', newRes.oaDetailed?.totals?.cssCharge);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
