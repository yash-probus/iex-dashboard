import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const charges = await prisma.stateCharges.findMany({
    where: {
      id: { in: [1868, 1869, 1872, 1873] }
    }
  });
  console.log(charges.map(c => ({
    id: c.id,
    category: c.category,
    supplyVoltageCategory: c.supplyVoltageCategory,
    voltageLevel: c.voltageLevel,
    demandFixedChargeKvaPerMonthRs: c.demandFixedChargeKvaPerMonthRs
  })));
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
