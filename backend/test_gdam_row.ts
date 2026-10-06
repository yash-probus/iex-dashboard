import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT COALESCE(forecasting_for, date)::text AS date
    FROM forecasting."GdamMcpForecast" LIMIT 1
  `);
  console.log('Row date:', rows[0].date);
}
run().catch(e => console.error(e)).finally(() => prisma.$disconnect());
