import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const targetId = '6fd06301-cd73-4aef-8220-da5a86cd0da8';
  const oldEntry = await prisma.savingsCalculatorEntry.findUnique({ where: { id: targetId } });
  const newEntry = await prisma.savingsCalculatorNewEntry.findUnique({ where: { id: targetId } });

  console.log("Found in old table:", !!oldEntry, oldEntry?.clientName);
  console.log("Found in new table:", !!newEntry, newEntry?.clientName);

  if (!oldEntry && !newEntry) {
    // List all clientNames in both
    const allOld = await prisma.savingsCalculatorEntry.findMany({ select: { id: true, clientName: true } });
    const allNew = await prisma.savingsCalculatorNewEntry.findMany({ select: { id: true, clientName: true } });
    console.log("All Old:", allOld);
    console.log("All New:", allNew);
  }
  process.exit(0);
}

run().catch(console.error);
