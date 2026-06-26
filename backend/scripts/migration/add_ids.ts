import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const tables = [
    'region_state',
    'discom_list',
    'ists_charges',
    'iex_fees',
    'prolt_margin',
    'ctu_charges',
    'stu_charges',
    'state_tariff'
  ];

  for (const table of tables) {
    try {
      console.log(`Processing ${table}...`);
      
      // 1. Drop existing primary key constraints if any
      const dropPkeyQuery = `
        DO $$ 
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT constraint_name 
                      FROM information_schema.table_constraints 
                      WHERE table_schema = 'prolt_energy' AND table_name = '${table}' AND constraint_type = 'PRIMARY KEY') 
            LOOP
                EXECUTE 'ALTER TABLE prolt_energy.${table} DROP CONSTRAINT ' || r.constraint_name;
            END LOOP;
        END $$;
      `;
      await prisma.$executeRawUnsafe(dropPkeyQuery);
      
      // 2. Try adding the column and primary key
      await prisma.$executeRawUnsafe(`ALTER TABLE prolt_energy.${table} ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;`);
      console.log(`Success: Added id to ${table}`);
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        // Column exists, maybe without PK. Let's ensure it's PK
        try {
          await prisma.$executeRawUnsafe(`ALTER TABLE prolt_energy.${table} ADD PRIMARY KEY (id);`);
          console.log(`Made existing id primary key on ${table}`);
        } catch (err: any) {
          console.log(`Failed or already PK on ${table}`);
        }
      } else if (e.message.includes('multiple primary keys')) {
         console.log(`Multiple primary keys error on ${table}. Trying to just add id column...`);
         try {
           await prisma.$executeRawUnsafe(`ALTER TABLE prolt_energy.${table} ADD COLUMN IF NOT EXISTS id SERIAL;`);
         } catch(err) {}
      } else {
        console.error(`Error on ${table}:`, e.message);
      }
    }
  }
}

run()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Migration complete.");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
