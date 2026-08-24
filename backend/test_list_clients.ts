import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const oldEntries = await prisma.savingsCalculatorEntry.findMany({ select: { id: true, clientName: true }, take: 5, orderBy: { createdAt: 'desc' } });
  const newEntries = await prisma.savingsCalculatorNewEntry.findMany({ select: { id: true, clientName: true }, take: 5, orderBy: { createdAt: 'desc' } });

  console.log("Old Clients:", oldEntries);
  console.log("New Clients:", newEntries);
  process.exit(0);
}

run().catch(console.error);
