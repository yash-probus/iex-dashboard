const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tariffs = await prisma.stateTariff.findMany({
    select: { voltageLevel: true },
    distinct: ['voltageLevel']
  });
  console.log(tariffs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
