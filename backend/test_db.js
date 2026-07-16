const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const demandCount = await prisma.nppRawDemandData.count();
  const genCount = await prisma.nppRawGenerationData.count();
  console.log({ demandCount, genCount });
}
run().then(() => process.exit(0));
