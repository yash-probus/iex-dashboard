import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tariffs = await prisma.stateTariff.findMany({ where: { state: 'Uttar Pradesh', consumerCategory: 'HV-2' } });
  const jan2026 = tariffs.filter(t => t.consumptionMonth === 202601);
  console.log(jan2026.slice(0, 3));
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
