import { PrismaClient } from '@prisma/client';

async function run() {
  const url = 'postgresql://postgres:postgres@localhost:5432/iex_dashboard';
  console.log("Connecting to local iex_dashboard:", url);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url
      }
    }
  });

  try {
    const oldEntries: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM savings_calculator_entries`);
    console.log(`Success! Found ${oldEntries.length} entries in savings_calculator_entries:`);
    console.log(oldEntries.map(e => ({ id: e.id, client_name: e.client_name, industry_name: e.industry_name })));

    const matchingOld = oldEntries.filter(e => 
      (e.client_name && e.client_name.toLowerCase().includes('mayank')) ||
      (e.industry_name && e.industry_name.toLowerCase().includes('ssn'))
    );
    console.log("Matching in OLD:", matchingOld);

    const newEntries: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM savings_calculator_new_entries`);
    console.log(`Found ${newEntries.length} entries in savings_calculator_new_entries:`);
    console.log(newEntries.map(e => ({ id: e.id, client_name: e.client_name, industry_name: e.industry_name })));

    const matchingNew = newEntries.filter(e => 
      (e.client_name && e.client_name.toLowerCase().includes('mayank')) ||
      (e.industry_name && e.industry_name.toLowerCase().includes('ssn'))
    );
    console.log("Matching in NEW:", matchingNew);
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
  process.exit(0);
}

run();
