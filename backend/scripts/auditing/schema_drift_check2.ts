import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tables = [
  'region_state',
  'discom_list',
  'ists_charges',
  'iex_fees',
  'prolt_margin',
  'ctu_charges'
];

async function run() {
  for (const table of tables) {
    console.log(`\n--- TABLE: ${table} ---`);
    const cols: any[] = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, udt_name, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'prolt_energy' AND table_name = $1
      ORDER BY ordinal_position;
    `, table);
    console.table(cols);
    
    // Check constraints (PK, UNIQUE)
    const constraints: any[] = await prisma.$queryRawUnsafe(`
      SELECT
          tc.constraint_type,
          kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'prolt_energy' AND tc.table_name = $1;
    `, table);
    console.table(constraints);
  }
}

run().finally(() => prisma.$disconnect());
