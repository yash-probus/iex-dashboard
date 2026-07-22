import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const ctu = await prisma.ctuCharges.findMany();
  console.log('CTU Charges:');
  for (const item of ctu) {
    console.log(`month: ${item.month}, charge: ${item.ctu_charges_rs_per_kwh}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
