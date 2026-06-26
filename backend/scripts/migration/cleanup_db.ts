import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Phase 5.0 Database Cleanup & Constraint Application ---');

  // 1. Cleanup all 8 tables
  console.log('Cleaning up existing mock data...');
  await prisma.regionState.deleteMany({});
  await prisma.discomList.deleteMany({});
  await prisma.istsCharges.deleteMany({});
  await prisma.iexFees.deleteMany({});
  await prisma.proltMargin.deleteMany({});
  await prisma.ctuCharges.deleteMany({});
  await prisma.stuCharges.deleteMany({});
  await prisma.stateTariff.deleteMany({});
  console.log('Cleanup complete. Database is pristine.');

  // 2. Add UNIQUE constraints
  console.log('Applying UNIQUE constraints...');
  const queries = [
    `ALTER TABLE prolt_energy.region_state ADD CONSTRAINT uq_region_state_code UNIQUE (state_code);`,
    `ALTER TABLE prolt_energy.discom_list ADD CONSTRAINT uq_discom_list_code UNIQUE (code);`,
    `ALTER TABLE prolt_energy.discom_list ADD CONSTRAINT uq_discom_list_name UNIQUE (legal_name);`,
    `ALTER TABLE prolt_energy.prolt_margin ADD CONSTRAINT uq_prolt_margin_month_cust UNIQUE (month, customer_id);`,
    `ALTER TABLE prolt_energy.ctu_charges ADD CONSTRAINT uq_ctu_charges_state_month UNIQUE (state_code, month);`,
    `ALTER TABLE prolt_energy.stu_charges ADD CONSTRAINT uq_stu_charges_composite UNIQUE (state_code, month, category, sub_category, voltage_level);`,
    `ALTER TABLE prolt_energy.state_tariff ADD CONSTRAINT uq_state_tariff_composite UNIQUE (state_code, month, category, sub_category, voltage_level, season, tod_name, tod);`,
    `ALTER TABLE prolt_energy.ists_charges ADD CONSTRAINT uq_ists_charges_state_date UNIQUE (state, date);`,
    `ALTER TABLE prolt_energy.iex_fees ADD CONSTRAINT uq_iex_fees_month UNIQUE (month);`
  ];

  for (const query of queries) {
    try {
      await prisma.$executeRawUnsafe(query);
      console.log(`SUCCESS: ${query}`);
    } catch (e: any) {
      console.log(`SKIPPED/ERROR: ${query}`);
      console.error(e.message);
    }
  }

  console.log('Constraint application complete.');
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
