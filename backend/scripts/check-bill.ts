import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const c = await prisma.stateTariff.findMany({ where: { state: 'UTTAR_PRADESH', supplyVoltageCategory: 'Up to 11 kV' } });
  c.forEach(x => {
    if(x.fromDate && x.fromDate.getFullYear() === 2025) {
       console.log(x.todStartTime, x.todEndTime, Number(x.energyRate), x.todChargePercent);
    }
  });
}
main().catch(console.error);
