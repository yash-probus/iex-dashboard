import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const oldEntries = await prisma.savingsCalculatorEntry.findMany();
  const newEntries = await prisma.savingsCalculatorNewEntry.findMany();

  console.log("Searching old entries by unit values...");
  for (const entry of oldEntries) {
    const cons = entry.todConsumptions as any;
    if (!cons) continue;
    for (const [month, data] of Object.entries(cons)) {
      if (typeof data !== 'object' || data === null) continue;
      const dataStr = JSON.stringify(data);
      if (dataStr.includes('20654') || dataStr.includes('16390') || dataStr.includes('44336')) {
        console.log(`Match in OLD Entry: ID=${entry.id}, Client=${entry.clientName}, Month=${month}`);
        console.log(data);
      }
    }
  }

  console.log("Searching new entries by unit values...");
  for (const entry of newEntries) {
    const cons = entry.todConsumptions as any;
    if (!cons) continue;
    for (const [month, data] of Object.entries(cons)) {
      if (typeof data !== 'object' || data === null) continue;
      const dataStr = JSON.stringify(data);
      if (dataStr.includes('20654') || dataStr.includes('16390') || dataStr.includes('44336')) {
        console.log(`Match in NEW Entry: ID=${entry.id}, Client=${entry.clientName}, Month=${month}`);
        console.log(data);
      }
    }
  }

  process.exit(0);
}

run().catch(console.error);
