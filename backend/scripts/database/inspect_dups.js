const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const dups = await prisma.stateTariff.findMany({
    where: { stateCode: 'UP', month: 4, voltageLevel: '11 kV', todName: 'TOD-1 (Off Peak-05:00-10:00)' }
  });
  console.log(dups);
}
main().catch(console.error).finally(() => prisma.$disconnect());
