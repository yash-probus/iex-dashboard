import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.stateTariff.findFirst({
    where: { state: 'Uttar Pradesh', consumerCategory: 'HV-2', month: 202701 }
  });
  console.log(t);
}
main().finally(() => prisma.$disconnect());
