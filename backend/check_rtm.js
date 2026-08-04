const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const d = await prisma.rtmDayahead.findFirst();
  console.log('DayAhead:', d);
  const n = await prisma.rtmNowcast.findFirst();
  console.log('Nowcast:', n);
}
main().catch(console.error).finally(() => prisma.$disconnect());
