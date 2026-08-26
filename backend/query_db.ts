import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const charges = await prisma.stateCharges.findMany({
    where: {
      state: { contains: 'Uttar Pradesh' }
    }
  });
  console.log(charges.map(c => ({
    id: c.id,
    state: c.state,
    category: c.category,
    subCategory: c.subCategory,
    supplyVoltageCategory: c.supplyVoltageCategory,
    demandFixedChargeKvaPerMonthRs: c.demandFixedChargeKvaPerMonthRs
  })));
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
