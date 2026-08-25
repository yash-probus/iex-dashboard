import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tariffs = await prisma.stateTariff.findMany({ where: { month: 202602 } });
  console.log("DB count for 202602:", tariffs.length);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
