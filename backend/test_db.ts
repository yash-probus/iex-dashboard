import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const entry = await prisma.savingsCalculatorNewEntry.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  console.log(JSON.stringify(entry, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
