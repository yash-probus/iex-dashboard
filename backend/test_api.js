const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ForecastService } = require('./src/modules/forecast/forecast.service');

async function main() {
  const result = await ForecastService.getPriceForecast('RTM', '2026-08-04', '2026-08-04', '15min', 'Model1');
  console.log(result[0]);
}
main().catch(console.error).finally(() => prisma.$disconnect());
