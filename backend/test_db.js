const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.savingsCalculatorEntry.findMany({ orderBy: { updatedAt: 'desc' }, take: 2 });
  console.log(entries.map(e => e.todConsumptions));
}
main().catch(console.error).finally(() => prisma.$disconnect());
