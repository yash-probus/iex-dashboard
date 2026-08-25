import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const commonData = {
    state: 'Uttar Pradesh',
    consumerCategory: 'HV-2',
    subCategory: 'Urban Schedule (Large & Heavy Power)',
    supplyVoltageCategory: 'Up to 11 kV',
    supplyVoltage: '11',
    baseEnergyRate: 6.80,
    baseEnergyUnit: 'kVAh'
  };

  const tods = [
    { start: '5:00', end: '11:00', percent: 0 },
    { start: '11:00', end: '17:00', percent: 0 },
    { start: '17:00', end: '23:00', percent: 15 },
    { start: '23:00', end: '5:00', percent: -15 }
  ];

  // Insert for Jan 2026 (consumptionMonth 202601, month 202602)
  for (const tod of tods) {
    const energyRate = 6.80 * (1 + (tod.percent / 100));
    await prisma.stateTariff.create({
      data: {
        ...commonData,
        month: 202602,
        consumptionMonth: 202601,
        todStartTime: tod.start,
        todEndTime: tod.end,
        todChargePercent: tod.percent,
        energyRate: energyRate
      }
    });
  }

  console.log('Inserted Jan 2026 tariffs successfully.');

  // Check FPPA
  const fppa = await prisma.fppaCharges.findFirst({
    where: { state: 'Uttar Pradesh', month: 202602 }
  });
  if (fppa) {
     console.log('FPPA for 202602:', fppa);
     await prisma.fppaCharges.update({
       where: { id: fppa.id },
       data: { fppaChargePercent: 0 }
     });
     console.log('Updated FPPA to 0 for 202602.');
  } else {
     await prisma.fppaCharges.create({
       data: {
         state: 'Uttar Pradesh',
         month: 202602,
         fppaChargePercent: 0
       }
     });
     console.log('Created FPPA 0 for 202602.');
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
