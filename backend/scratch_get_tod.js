const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const clients = await prisma.savingsCalculatorEntry.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, clientName: true } });
  for (const c of clients) {
    const { SavingsCalculatorService } = require('./src/modules/savings-calculator/savings-calculator.service');
    const res = await SavingsCalculatorService.calculateMarketDecisionAllMonths(c.id);
    console.log(`OLD Client: ${c.clientName} | Gross: ${res.grossSavings}`);
  }
  await prisma.$disconnect();
}

run();
