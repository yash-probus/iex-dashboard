const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const allTariffs = await prisma.stateTariff.findMany();
  const seen = new Set();
  let deletedCount = 0;

  for (const row of allTariffs) {
    // create a unique key based on the fields that should be unique
    const key = [
      row.stateCode,
      row.month,
      row.category,
      row.subCategory,
      row.voltageLevel,
      row.season,
      row.todName,
      row.tod
    ].join('|');

    if (seen.has(key)) {
      await prisma.stateTariff.delete({ where: { id: row.id } });
      deletedCount++;
    } else {
      seen.add(key);
    }
  }

  console.log(`Deleted ${deletedCount} duplicate records from StateTariff.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
