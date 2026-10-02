import prisma from './config/prisma';

async function main() {
  const result = await prisma.$queryRawUnsafe(`SELECT DISTINCT meter_id FROM "forecasting"."consumer_demand_forecasting" WHERE meter_id IS NOT NULL`);
  console.log(result);
}
main().catch(console.error);
