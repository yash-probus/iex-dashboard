import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tariffs = await prisma.stateTariff.findMany();
  let updatedCount = 0;

  for (const t of tariffs) {
    if (!t.month) continue;
    
    const year = Math.floor(t.month / 100);
    const m = t.month % 100;
    
    let consumptionMonth;
    if (m === 1) {
      consumptionMonth = (year - 1) * 100 + 12;
    } else {
      consumptionMonth = t.month - 1;
    }

    await prisma.stateTariff.update({
      where: { id: t.id },
      data: { consumptionMonth }
    });
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} tariff records with consumptionMonth.`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
