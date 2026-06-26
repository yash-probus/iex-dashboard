import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Fixing ists_charges sequence...');
  
  await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS prolt_energy.ists_charges_id_seq;`);
  console.log('Sequence created.');

  await prisma.$executeRawUnsafe(`SELECT setval('prolt_energy.ists_charges_id_seq', COALESCE((SELECT MAX(id)+1 FROM prolt_energy.ists_charges), 1), false);`);
  console.log('Sequence value set.');

  await prisma.$executeRawUnsafe(`ALTER TABLE prolt_energy.ists_charges ALTER COLUMN id SET DEFAULT nextval('prolt_energy.ists_charges_id_seq');`);
  console.log('Table altered.');

  // Verify
  const seq: any[] = await prisma.$queryRawUnsafe(`SELECT pg_get_serial_sequence('prolt_energy.ists_charges', 'id');`);
  console.log('Current Sequence:', seq);
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
