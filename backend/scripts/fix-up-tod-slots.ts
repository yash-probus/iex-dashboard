import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const tariffs = await prisma.stateTariff.findMany({
    where: { state: 'Uttar Pradesh', todStartTime: { not: '—' } }
  });

  // Group by composite key
  const groups: Record<string, typeof tariffs> = {};
  for (const t of tariffs) {
    const key = `${t.consumerCategory}|${t.subCategory}|${t.supplyVoltageCategory}|${t.supplyVoltage}|${t.month}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  let updatedCount = 0;

  for (const key of Object.keys(groups)) {
    const group = groups[key];
    
    // Check if this group has exactly the 4 old slots
    const has5to10 = group.find(t => t.todStartTime === '5:00' && t.todEndTime === '10:00');
    const has10to19 = group.find(t => t.todStartTime === '10:00' && t.todEndTime === '19:00');
    const has19to3 = group.find(t => t.todStartTime === '19:00' && t.todEndTime === '3:00');
    const has3to5 = group.find(t => t.todStartTime === '3:00' && t.todEndTime === '5:00');

    if (group.length === 4 && has5to10 && has10to19 && has19to3 && has3to5) {
      // Find the true base rate from the 0% slot (10:00 to 19:00 or 3:00 to 5:00)
      const trueBaseRate = Number(has10to19.baseEnergyRate);

      for (const t of group) {
        let newStart, newEnd, newPercent, newRate;

        if (t.id === has5to10.id) {
          newStart = '05:00'; newEnd = '11:00'; newPercent = -15;
          newRate = trueBaseRate * 0.85;
        } else if (t.id === has10to19.id) {
          newStart = '11:00'; newEnd = '17:00'; newPercent = 0;
          newRate = trueBaseRate;
        } else if (t.id === has19to3.id) {
          newStart = '17:00'; newEnd = '23:00'; newPercent = 15;
          newRate = trueBaseRate * 1.15;
        } else if (t.id === has3to5.id) {
          newStart = '23:00'; newEnd = '05:00'; newPercent = 0;
          newRate = trueBaseRate;
        }

        await prisma.stateTariff.update({
          where: { id: t.id },
          data: {
            todStartTime: newStart,
            todEndTime: newEnd,
            todChargePercent: newPercent,
            baseEnergyRate: trueBaseRate,
            energyRate: newRate
          }
        });
        updatedCount++;
      }
    }
  }

  console.log(`Successfully updated ${updatedCount} TOD records for UP to the new slots and fixed the base rate bug.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
