import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log(await prisma.$queryRawUnsafe(`
    SELECT pg_get_serial_sequence('prolt_energy.ists_charges', 'id') as seq_name;
  `));
}

run().finally(() => prisma.$disconnect());
