const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const charges = await prisma.stateCharges.findFirst({
    where: { state: { in: ['Uttar Pradesh', 'UP', 'UTTAR PRADESH'] } }
  });
  console.log("State charges:", charges);
  process.exit(0);
}
run();
