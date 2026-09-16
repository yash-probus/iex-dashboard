import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const entries = await prisma.traderPerformanceEntry.findMany();
  entries.forEach(e => console.log(e.id, e.clientName));
  process.exit(0);
}
run();
