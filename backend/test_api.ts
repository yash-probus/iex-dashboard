import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { ForecastService } from './src/modules/forecast/forecast.service';

async function main() {
  const result = await ForecastService.getPriceForecast('RTM', '2026-08-03', '2026-08-04', '15min', 'Model1');
  console.log(result.intervals.find((r: any) => r.priceRangeDayahead && r.priceRangeDayahead !== 'N/A' || r.priceRangeNowcast && r.priceRangeNowcast !== 'N/A'));
}
main().catch(console.error).finally(() => prisma.$disconnect());
