const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.traderPerformanceEntry.update({
    where: { id: '66d1cf98f02f83c180da1d0d' },
    data: { consumerCategory: 'HV-2' }
  });
  console.log("Updated category to HV-2");
  process.exit(0);
}
run();
