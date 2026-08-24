import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const oldEntries = await prisma.savingsCalculatorEntry.findMany({
    select: {
      id: true,
      clientName: true,
      industryName: true,
      sanctionedLoadKw: true,
      discom: true,
      stateCode: true,
      createdAt: true
    }
  });

  const newEntries = await prisma.savingsCalculatorNewEntry.findMany({
    select: {
      id: true,
      clientName: true,
      industryName: true,
      sanctionedLoadKw: true,
      discom: true,
      stateCode: true,
      createdAt: true
    }
  });

  console.log("=== ALL OLD ENTRIES IN DB ===");
  console.log(JSON.stringify(oldEntries, null, 2));

  console.log("=== ALL NEW ENTRIES IN DB ===");
  console.log(JSON.stringify(newEntries, null, 2));

  process.exit(0);
}

run().catch(console.error);
