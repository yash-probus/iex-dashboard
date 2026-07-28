import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const stateCharges = await prisma.stateCharges.findFirst({
    where: {
      state: 'UTTAR_PRADESH',
      discom: null,
      category: 'HV-2',
      fromDate: { lte: new Date('2025-06-19') },
      toDate: { gte: new Date('2025-06-19') },
    }
  });
  console.log('State Charges found:', stateCharges);
}

main().catch(console.error).finally(() => prisma.$disconnect());
