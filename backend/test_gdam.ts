import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const counts = await prisma.$queryRawUnsafe(`SELECT model_number, COUNT(*) FROM forecasting."GdamMcpForecast" GROUP BY model_number`);
  console.log('Forecasting schema:', counts);
  
  const publicCounts = await prisma.$queryRawUnsafe(`SELECT model_number, COUNT(*) FROM public."GdamMcpForecast" GROUP BY model_number`);
  console.log('Public schema:', publicCounts);
}
run().catch(e => console.error(e)).finally(() => prisma.$disconnect());
