import { PrismaClient } from '@prisma/client';

async function run() {
  const url = 'postgresql://postgres:iex_sec_k9P2mX_2026@65.2.183.69:5432/Prolt_Operations';
  console.log("Connecting to PROD database at 65.2.183.69:", url);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url
      }
    }
  });

  try {
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

    console.log("=== PROD OLD ENTRIES ===");
    console.log(JSON.stringify(oldEntries, null, 2));

    console.log("=== PROD NEW ENTRIES ===");
    console.log(JSON.stringify(newEntries, null, 2));

    const matchOld = oldEntries.filter(e => e.clientName.toLowerCase().includes('mayank') || (e.industryName && e.industryName.toLowerCase().includes('ssn')));
    console.log("Matching in PROD OLD:", matchOld);
  } catch (err: any) {
    console.error("Error connecting to PROD database:", err.message);
  } finally {
    await prisma.$disconnect();
  }
  process.exit(0);
}

run();
