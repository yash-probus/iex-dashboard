import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const summerMonths = [202604, 202605, 202606, 202607, 202608, 202609, 202504, 202505, 202506, 202507, 202508, 202509];
  
  const rows = await prisma.stateTariff.findMany({
    where: {
      state: 'Uttar Pradesh',
      month: { in: summerMonths },
      todStartTime: { not: '—' }
    }
  });
  
  console.log(`Found ${rows.length} rows for UP summer.`);
  let updated = 0;

  for (const row of rows) {
    let newStart = '';
    let newEnd = '';
    let newPercent = 0;

    // Normalizing existing single-digit hours for matching
    const startStr = row.todStartTime.replace(/^0/, '');
    const endStr = row.todEndTime.replace(/^0/, '');

    if (startStr === '5:00' && endStr === '11:00') {
      newStart = '05:00'; newEnd = '10:00'; newPercent = -15;
    } else if (startStr === '11:00' && endStr === '17:00') {
      newStart = '10:00'; newEnd = '19:00'; newPercent = 0;
    } else if (startStr === '17:00' && endStr === '23:00') {
      newStart = '19:00'; newEnd = '03:00'; newPercent = 15;
    } else if (startStr === '23:00' && endStr === '5:00') {
      newStart = '03:00'; newEnd = '05:00'; newPercent = 0;
    } else {
      continue;
    }

    const baseRate = Number(row.baseEnergyRate);
    const newEnergyRate = baseRate * (1 + newPercent / 100);

    await prisma.stateTariff.update({
      where: { id: row.id },
      data: {
        todStartTime: newStart,
        todEndTime: newEnd,
        todChargePercent: newPercent,
        energyRate: newEnergyRate
      }
    });
    updated++;
  }
  
  console.log(`Updated ${updated} rows successfully.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
