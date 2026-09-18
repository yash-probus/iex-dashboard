import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const startStr = "2026-08-01";
  console.log("startStr:", startStr);
  console.log("new Date(startStr):", new Date(startStr));
  
  const stateCharges = await prisma.stateCharges.findFirst({
    where: {
      state: { in: ['Uttar Pradesh', 'UP'] },
      discom: null,
      category: 'HV-2',
      fromDate: { lte: new Date(startStr) },
      toDate: { gte: new Date(startStr) }
    }
  });
  
  console.log("Result for discom: null ->", !!stateCharges);
  if (stateCharges) console.log(stateCharges.fromDate, stateCharges.toDate);
  
  const stateChargesNpcl = await prisma.stateCharges.findFirst({
    where: {
      state: { in: ['Uttar Pradesh', 'UP'] },
      discom: 'NPCL',
      category: 'HV-2',
      fromDate: { lte: new Date(startStr) },
      toDate: { gte: new Date(startStr) }
    }
  });
  
  console.log("Result for discom: 'NPCL' ->", !!stateChargesNpcl);
  if (stateChargesNpcl) console.log(stateChargesNpcl.fromDate, stateChargesNpcl.toDate);
}

main().catch(console.error).finally(() => prisma.$disconnect());
