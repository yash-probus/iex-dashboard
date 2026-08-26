import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const entry = await prisma.savingsCalculatorEntry.findFirst({
    where: { stateCode: 'Uttar Pradesh', consumerCategory: 'HV-2' },
    orderBy: { createdAt: 'desc' }
  });
  console.log(entry);
}
main().finally(() => prisma.$disconnect());
