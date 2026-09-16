const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.traderPerformanceEntry.update({
    where: { id: '66d1cf98f02f83c180da1d0d' },
    data: { stateCode: 'UP', discom: 'NPCL' }
  });
  console.log("Updated stateCode and discom");
  process.exit(0);
}
run();
