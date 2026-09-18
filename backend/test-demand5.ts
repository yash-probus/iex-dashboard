import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entry = await prisma.savingsCalculatorNewEntry.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log("Keys in todConsumptions:", Object.keys(entry?.todConsumptions || {}));
}
main().catch(console.error).finally(() => prisma.$disconnect());
