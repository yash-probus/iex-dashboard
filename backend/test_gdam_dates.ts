import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const dates = await prisma.$queryRawUnsafe(`SELECT MIN(date), MAX(date) FROM forecasting."GdamMcpForecast" WHERE model_number = 1`);
  console.log('Dates for model 1:', dates);
  const dates2 = await prisma.$queryRawUnsafe(`SELECT MIN(date), MAX(date) FROM forecasting."GdamMcpForecast" WHERE model_number = 2`);
  console.log('Dates for model 2:', dates2);
}
run().catch(e => console.error(e)).finally(() => prisma.$disconnect());
