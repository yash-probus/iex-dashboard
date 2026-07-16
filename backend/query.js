const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const entries = await prisma.savingsCalculatorEntry.findMany();
  console.log(JSON.stringify(entries, null, 2));
}
run().then(() => process.exit(0));
