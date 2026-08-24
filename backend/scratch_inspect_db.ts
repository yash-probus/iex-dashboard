import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const oldEntries = await prisma.savingsCalculatorEntry.findMany();
  const newEntries = await prisma.savingsCalculatorNewEntry.findMany();

  console.log("=== OLD ENTRIES ===");
  for (const e of oldEntries) {
    console.log(`ID: ${e.id}`);
    console.log(`ClientName: ${e.clientName}`);
    console.log(`Discom: ${e.discom}, StateCode: ${e.stateCode}`);
    console.log(`SanctionedLoad: ${e.sanctionedLoadKw}, BilledDemand: ${e.billedDemandKv}`);
    console.log(`ConsultancyFee: ${e.consultancyFee}, PlatformFee: ${e.probusPlatformFee}`);
    console.log(`Months: ${Object.keys(e.todConsumptions as any || {}).filter(m => m.includes('-'))}`);
    console.log("-----------------------------------------");
  }

  console.log("\n=== NEW ENTRIES ===");
  for (const e of newEntries) {
    console.log(`ID: ${e.id}`);
    console.log(`ClientName: ${e.clientName}`);
    console.log(`Discom: ${e.discom}, StateCode: ${e.stateCode}`);
    console.log(`SanctionedLoad: ${e.sanctionedLoadKw}, BilledDemand: ${e.billedDemandKv}`);
    console.log(`ConsultancyFee: ${e.consultancyFee}, PlatformFee: ${e.probusPlatformFee}`);
    console.log(`Months: ${Object.keys(e.todConsumptions as any || {}).filter(m => m.includes('-'))}`);
    console.log("-----------------------------------------");
  }

  process.exit(0);
}

run().catch(console.error);
