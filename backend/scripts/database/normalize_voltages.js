const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const models = ['stateTariff', 'stuCharges'];
  let totalUpdated = 0;

  for (const model of models) {
    if (!prisma[model]) continue;
    const records = await prisma[model].findMany({
      where: { voltageLevel: { not: null } }
    });

    for (const record of records) {
      if (!record.voltageLevel) continue;
      let normalized = record.voltageLevel.trim();
      
      // Match something like "11", "11kV", "11 KV", "11kv"
      const match = normalized.match(/^(\d+)\s*(kv)?$/i);
      if (match) {
        normalized = `${match[1]} kV`;
      }

      if (normalized !== record.voltageLevel) {
        await prisma[model].update({
          where: { id: record.id },
          data: { voltageLevel: normalized }
        });
        totalUpdated++;
      }
    }
    console.log(`Updated voltages in ${model}`);
  }
  console.log(`Total records normalized: ${totalUpdated}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
