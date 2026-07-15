import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const states = await prisma.stateTariff.findMany({
    select: { state: true },
    distinct: ['state']
  });
  console.log("States:", states);
}
run();
