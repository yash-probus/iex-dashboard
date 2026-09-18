import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.savingsCalculatorNewEntry.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log("Total entries:", entries.length);
  for (const entry of entries.slice(0, 5)) {
    console.log(`\n=== ID: ${entry.id}, Client: ${entry.clientName} ===`);
    console.log("todConsumptions:", JSON.stringify(entry.todConsumptions, null, 2));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
