import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log('--- region_state ---');
  console.log(await prisma.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'prolt_energy' AND table_name = 'region_state'"));
  
  console.log('--- ists_charges ---');
  console.log(await prisma.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'prolt_energy' AND table_name = 'ists_charges'"));
}

run().finally(() => prisma.$disconnect());
