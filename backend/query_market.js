const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const history = await prisma.savingsCalculatorEntryHistory.findMany({
    orderBy: { changedAt: 'desc' },
    take: 3
  });
  console.log(history.map(h => ({ id: h.id, version: h.version, tod: h.todConsumptions })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
