import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log(await prisma.$queryRawUnsafe("SELECT * FROM prolt_energy.ists_charges LIMIT 1"));
}

run().finally(() => prisma.$disconnect());
