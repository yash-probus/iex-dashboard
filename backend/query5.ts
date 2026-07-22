import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const sc = await prisma.stateCharges.findMany({ where: { state: 'UTTAR_PRADESH', category: 'HV-2' } });
  for (const item of sc) {
    if (item.stuLossPercent === 0 || item.stuLossPercent === null || Number(item.stuLossPercent) === 0) {
      console.log('FOUND ZERO STU LOSS:', item);
    }
  }
  console.log('Done checking STU loss 0.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
