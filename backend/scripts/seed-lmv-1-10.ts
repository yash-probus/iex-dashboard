import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const data = [
  // LMV-1
  { cat: 'LMV-1', sub: 'Rural: Lifeline (<=1 kW, <=100 kWh/mo)', fixed: 50, energy: 3.00 },
  { cat: 'LMV-1', sub: 'Rural: Metered (Other)', fixed: 90, energy: 5.50 },
  { cat: 'LMV-1', sub: 'Bulk Load (>=50 kW single point)', fixed: 110, energy: 7.00 },
  { cat: 'LMV-1', sub: 'Urban Metered: Lifeline (<=1 kW)', fixed: 50, energy: 3.00 },
  { cat: 'LMV-1', sub: 'Urban Metered: General', fixed: 110, energy: 6.50 },
  // LMV-2
  { cat: 'LMV-2', sub: 'Rural Schedule', fixed: 110, energy: 5.50 },
  { cat: 'LMV-2', sub: 'Urban: Load <= 4 kW', fixed: 330, energy: 8.40 },
  { cat: 'LMV-2', sub: 'Urban: Load > 4 kW', fixed: 450, energy: 8.75 },
  // LMV-3
  { cat: 'LMV-3', sub: 'Unmetered (Gram/Nagar/Nigam)', fixed: 4200, energy: 0 },
  { cat: 'LMV-3', sub: 'Metered (Gram/Nagar/Nigam)', fixed: 250, energy: 8.50 },
  // LMV-4
  { cat: 'LMV-4', sub: 'Public Institutions', fixed: 300, energy: 8.25 },
  { cat: 'LMV-4', sub: 'Private Institutions', fixed: 350, energy: 9.00 },
  // LMV-5
  { cat: 'LMV-5', sub: 'Rural: Unmetered', fixed: 170, energy: 0 },
  { cat: 'LMV-5', sub: 'Rural: Metered', fixed: 70, energy: 2.00 },
  { cat: 'LMV-5', sub: 'Urban: Metered', fixed: 130, energy: 6.00 },
  // LMV-6
  { cat: 'LMV-6', sub: 'Urban (Up to & Above 20 kW)', fixed: 290, energy: 7.30 },
  { cat: 'LMV-6', sub: 'Rural Schedule', fixed: 268.25, energy: 6.75 },
  // LMV-7
  { cat: 'LMV-7', sub: 'Urban: Metered', fixed: 375, energy: 8.50 },
  { cat: 'LMV-7', sub: 'Urban: Unmetered', fixed: 3300, energy: 0 },
  { cat: 'LMV-7', sub: 'Rural Schedule', fixed: 346.87, energy: 7.86 },
  // LMV-8
  { cat: 'LMV-8', sub: 'All Sub-categories', fixed: 375, energy: 8.50 },
  // LMV-9
  { cat: 'LMV-9', sub: 'Unmetered (Illumination/Mela)', fixed: 4750, energy: 0 },
  { cat: 'LMV-9', sub: 'Metered: Residential', fixed: 200, energy: 8.00 },
  { cat: 'LMV-9', sub: 'Metered: Others', fixed: 300, energy: 9.00 },
  // LMV-10
  { cat: 'LMV-10', sub: 'All Sub-categories', fixed: 0, energy: 0 }
];

async function main() {
  for (const item of data) {
    for (let m = 1; m <= 12; m++) {
      const existingTariff = await prisma.stateTariff.findFirst({
        where: {
          state: 'UTTAR PRADESH',
          consumerCategory: item.cat,
          subCategory: item.sub,
          supplyVoltageCategory: 'Low Tension (LT)',
          supplyVoltage: 'LT',
          month: m,
          todStartTime: '00:00',
          todEndTime: '24:00'
        }
      });

      if (existingTariff) {
        await prisma.stateTariff.update({
          where: { id: existingTariff.id },
          data: {
            baseEnergyRate: item.energy,
            energyRate: item.energy
          }
        });
      } else {
        await prisma.stateTariff.create({
          data: {
            state: 'UTTAR PRADESH',
            consumerCategory: item.cat,
            subCategory: item.sub,
            supplyVoltageCategory: 'Low Tension (LT)',
            supplyVoltage: 'LT',
            month: m,
            todStartTime: '00:00',
            todEndTime: '24:00',
            baseEnergyRate: item.energy,
            baseEnergyUnit: 'kWh',
            todChargePercent: 0,
            energyRate: item.energy
          }
        });
      }
    }

    // Also seed StateCharges to match these!
    const existingCharges = await prisma.stateCharges.findFirst({
      where: {
        state: 'UTTAR_PRADESH',
        category: item.cat,
        subCategory: item.sub,
        supplyVoltageCategory: 'Low Tension (LT)'
      }
    });
    if (!existingCharges) {
      await prisma.stateCharges.create({
        data: {
          state: 'UTTAR_PRADESH',
          category: item.cat,
          subCategory: item.sub,
          supplyVoltageCategory: 'Low Tension (LT)',
          voltageLevel: 'LT',
          fromDate: new Date('2024-04-01'),
          toDate: new Date('2025-03-31'),
          demandFixedChargeKvaPerMonthRs: item.fixed,
          crossSubsidy: 0,
          distributionWheelingCharges: 0,
          stuCharges: 0,
          stuLossPercent: 0,
          wheelingLossPercent: 0,
          additionalCharge: 0
        }
      });
    }
  }
  console.log('Seeded LMV-1 to LMV-10 data successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
