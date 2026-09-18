import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const charges = await prisma.stateCharges.findMany({
    where: {
      state: { in: ['Uttar Pradesh', 'UP'] },
      category: 'HV-2'
    },
    orderBy: { fromDate: 'desc' }
  });
  
  console.log(`Found ${charges.length} StateCharges for UP HV-2`);
  for (const c of charges) {
    console.log(`ID: ${c.id}, From: ${c.fromDate}, To: ${c.toDate}, Discom: ${c.discom}, DemandCharge: ${c.demandFixedChargeKvaPerMonthRs}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
