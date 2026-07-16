import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const stateTariff = await prisma.stateCharges.findFirst({
    where: { stateCode: 'UP' }
  });
  console.log(stateTariff);
}
main();
