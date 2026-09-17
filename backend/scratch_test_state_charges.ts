import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const charges = await prisma.$queryRawUnsafe(`
    SELECT "state", "discom", "category", "demand_fixed_charge_kva_per_month_rs"
    FROM "public"."state_charges" 
    WHERE "state" ILIKE '%Uttar%' AND "category" ILIKE '%HV-2%'
    LIMIT 5
  `);
  console.log(charges);
}
main().finally(() => prisma.$disconnect());
