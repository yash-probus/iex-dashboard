import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const entries = await prisma.savingsCalculatorEntry.findMany({
    select: { id: true, clientName: true }
  });
  console.log(entries);
}
run().catch(console.error).finally(() => prisma.$disconnect());
