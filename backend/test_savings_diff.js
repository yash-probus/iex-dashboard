const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const oldEntries = await prisma.savingsCalculatorEntry.findMany({ take: 1, orderBy: { createdAt: 'desc' } });
  const newEntries = await prisma.savingsCalculatorNewEntry.findMany({ take: 1, orderBy: { createdAt: 'desc' } });

  console.log("Old Entry ID:", oldEntries[0]?.id);
  console.log("New Entry ID:", newEntries[0]?.id);

  if (oldEntries[0]) {
    const oldCons = oldEntries[0].todConsumptions;
    console.log("Old Consumptions:", JSON.stringify(oldCons).substring(0, 200));
  }
  if (newEntries[0]) {
    const newCons = newEntries[0].todConsumptions;
    console.log("New Consumptions:", JSON.stringify(newCons).substring(0, 200));
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
