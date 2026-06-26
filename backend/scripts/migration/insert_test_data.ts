import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO prolt_energy.region_state (regional_grid, region_code, region_name, state_name, state_code, state_or_ut) 
      VALUES ('TEST GRID', 'TG', 'Test Region', 'Test State', 99, NULL)
      ON CONFLICT DO NOTHING;
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO prolt_energy.discom_list (code, legal_name, state_code, discom_type) 
      VALUES ('TD', 'Test Discom', 99, 'Gov')
      ON CONFLICT DO NOTHING;
    `);
    
    // Test decimals for Verification 2
    await prisma.$executeRawUnsafe(`
      INSERT INTO prolt_energy.iex_fees (month, exchange_fees) 
      VALUES (6, 12.3456)
      ON CONFLICT DO NOTHING;
    `);

    console.log('Test data inserted.');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
