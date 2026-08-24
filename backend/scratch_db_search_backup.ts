import { PrismaClient } from '@prisma/client';

async function run() {
  const backupUrl = 'postgresql://postgres:iex_sec_k9P2mX_2026@localhost:5433/Prolt_Operations';
  console.log("Connecting to backup DB:", backupUrl);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: backupUrl
      }
    }
  });

  try {
    const oldEntries = await prisma.savingsCalculatorEntry.findMany({
      where: {
        OR: [
          { clientName: { contains: 'SSN', mode: 'insensitive' } },
          { clientName: { contains: 'Mayank', mode: 'insensitive' } }
        ]
      }
    });
    console.log("Found in backup savingsCalculatorEntry:", oldEntries.map(e => ({ id: e.id, clientName: e.clientName })));
  } catch (e: any) {
    console.error("Backup DB error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
  process.exit(0);
}

run();
