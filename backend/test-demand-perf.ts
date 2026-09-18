import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.traderPerformanceEntry.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log("Total perf entries:", entries.length);
  for (const entry of entries.slice(0, 5)) {
    console.log(`ID: ${entry.id}, Client: ${entry.clientName}, Demand: ${entry.sanctionedLoadKw}, Category: ${entry.consumerCategory}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
