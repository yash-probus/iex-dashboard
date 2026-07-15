import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const tariffs = await prisma.stateTariff.findMany({
    where: { state: 'Uttar Pradesh', todStartTime: { not: '—' } }
  });
  
  if (tariffs.length > 0) {
    console.log(tariffs[0]);
    console.log(tariffs[1]);
    console.log(tariffs[2]);
    console.log(tariffs[3]);
  }
}
run();
