import { PrismaClient } from '@prisma/client';

async function trySearch(url: string) {
  console.log("Trying URL:", url);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url
      }
    }
  });

  try {
    const entries = await prisma.savingsCalculatorEntry.findMany();
    console.log(`Success! Found ${entries.length} entries in savingsCalculatorEntry:`);
    console.log(entries.map(e => ({ id: e.id, clientName: e.clientName, industryName: (e as any).industryName })));

    const ssnEntries = entries.filter(e => 
      e.clientName.toLowerCase().includes('ssn') || 
      e.clientName.toLowerCase().includes('mayank') || 
      ((e as any).industryName && (e as any).industryName.toLowerCase().includes('ssn'))
    );
    if (ssnEntries.length > 0) {
      console.log("Found matching entry!", ssnEntries);
    }
    
    const newEntries = await prisma.savingsCalculatorNewEntry.findMany();
    console.log(`Found ${newEntries.length} entries in savingsCalculatorNewEntry:`);
    console.log(newEntries.map(e => ({ id: e.id, clientName: e.clientName })));
    
    return true;
  } catch (err: any) {
    console.log("Failed:", err.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const urls = [
    'postgresql://postgres:postgres@localhost:5432/Prolt_Operations',
    'postgresql://postgres:iex_sec_k9P2mX_2026@localhost:5432/Prolt_Operations',
    'postgresql://postgres:postgres@127.0.0.1:5432/Prolt_Operations',
    'postgresql://postgres:iex_sec_k9P2mX_2026@127.0.0.1:5432/Prolt_Operations'
  ];

  for (const url of urls) {
    const success = await trySearch(url);
    if (success) {
      console.log("Found correct database connection URL:", url);
      break;
    }
  }
  process.exit(0);
}

run();
