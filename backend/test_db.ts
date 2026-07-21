import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tariffs = await prisma.stateTariff.findMany({
    select: { consumerCategory: true, subCategory: true }
  });
  const unique = new Set();
  tariffs.forEach(t => {
    if (t.consumerCategory.startsWith('LMV') || t.consumerCategory.startsWith('HV')) {
      unique.add(`${t.consumerCategory} | ${t.subCategory}`);
    }
  });
  console.log(Array.from(unique).sort());
}
main().catch(console.error).finally(() => prisma.$disconnect());
