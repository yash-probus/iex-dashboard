import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const tariffs = await prisma.stateTariff.findMany({
    where: { state: 'Uttar Pradesh', consumerCategory: 'HV-2', month: 202604 }
  });
  
  console.log(tariffs.map(t => ({
    id: t.id,
    start: t.todStartTime,
    end: t.todEndTime,
    base: Number(t.baseEnergyRate),
    percent: t.todChargePercent,
    rate: Number(t.energyRate)
  })));
}
run();
