import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'prolt_energy' AND table_name = 'region_state';
  `);
  console.log('--- Columns of prolt_energy.region_state ---');
  console.log(columns);
  
  const sample = await prisma.$queryRawUnsafe(`
    SELECT * FROM prolt_energy.region_state LIMIT 5;
  `);
  console.log('--- Sample data in prolt_energy.region_state ---');
  console.log(sample);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
