import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const startStr = '2026-11-01';
  const endStr = '2026-11-30';
  const stateCharges = await prisma.stateCharges.findFirst({
    where: {
      state: 'UTTAR_PRADESH',
      category: 'HV-2',
      fromDate: { lte: new Date(startStr) },
      toDate: { gte: new Date(endStr) },
    }
  });
  console.log('findFirst returned:', stateCharges ? `voltage: ${stateCharges.voltageLevel}, stuLoss: ${stateCharges.stuLossPercent}, wheelingLoss: ${stateCharges.wheelingLossPercent}` : 'NULL');
}
main().catch(console.error).finally(() => prisma.$disconnect());
