import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const e = await prisma.savingsCalculatorNewEntry.findUnique({
    where: { id: 'c768459c-b0d3-4e50-bbc7-d59ce388542e' }
  });
  console.log("TOD Consumptions:", JSON.stringify(e?.todConsumptions, null, 2));
  process.exit(0);
}

run().catch(console.error);
