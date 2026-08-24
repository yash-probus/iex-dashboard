const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const oldId = '6fd06301-cd73-4aef-8220-da5a86cd0da8';
  const newId = '701fb54d-cbae-4dd1-8c51-6f30d48ddb39';
  const month = '2026-01';

  const oldEntry = await prisma.savingsCalculatorEntry.findUnique({ where: { id: oldId } });
  const newEntry = await prisma.savingsCalculatorNewEntry.findUnique({ where: { id: newId } });

  console.log("=== OLD ENTRY todConsumptions (January 2026) ===");
  console.log(JSON.stringify(oldEntry.todConsumptions[month], null, 2));

  console.log("\n=== NEW ENTRY todConsumptions (January 2026) ===");
  console.log(JSON.stringify(newEntry.todConsumptions[month], null, 2));

  await prisma.$disconnect();
}

run();
