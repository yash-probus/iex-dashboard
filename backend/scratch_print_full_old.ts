import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const e = await prisma.savingsCalculatorEntry.findUnique({
    where: { id: '6f8931eb-378a-490b-a213-0546504ad486' } // Mr. Rajeev Jaiswal
  });
  console.log("Mr. Rajeev Jaiswal:", JSON.stringify(e, null, 2));
  process.exit(0);
}

run().catch(console.error);
