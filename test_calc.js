const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { SavingsCalculatorService } = require('./backend/src/modules/savings-calculator/savings-calculator.service.ts');
const { TraderPerformanceService } = require('./backend/src/modules/trader-performance/trader-performance.service.ts');

async function test() {
  const tEntry = await prisma.traderPerformanceEntry.findFirst({
    where: { clientName: { not: null } }
  });
  
  if (!tEntry) return console.log("No trader entry found");
  
  // We need to call calculateMarketDecision on both
  // But wait, the methods are written in TypeScript, we should compile or use ts-node
}
test();
