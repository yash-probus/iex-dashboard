import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.savingsCalculatorEntry.findMany({ select: { id: true, clientName: true, sanctionedLoadKw: true } });
  console.log(entries);
}
main();
