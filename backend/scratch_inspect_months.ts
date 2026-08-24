import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const entries = await prisma.savingsCalculatorNewEntry.findMany();
  for (const e of entries) {
    const months = Object.keys(e.todConsumptions as any).filter(m => m.includes('-') && !m.startsWith('_'));
    console.log(`Client: ${e.clientName} (ID: ${e.id}) has months:`, months);
  }
  process.exit(0);
}

run().catch(console.error);
