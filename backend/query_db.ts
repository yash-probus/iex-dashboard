import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tariffs = await prisma.stateTariff.findMany({
    where: { todStartTime: '23:00', todEndTime: '5:00' },
    take: 5
  });
  console.log(tariffs);
}
main();
