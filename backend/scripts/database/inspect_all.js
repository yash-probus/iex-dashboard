const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- UP Tariffs ---');
  const upTariffs = await prisma.stateTariff.findMany({
    where: { stateCode: 'UP' }
  });
  console.log('UP Tariffs count:', upTariffs.length);
  console.log(JSON.stringify(upTariffs.slice(0, 10), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
