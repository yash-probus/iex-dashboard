import { ForecastService } from './src/modules/forecast/forecast.service';

async function main() {
  const res = await ForecastService.getPriceForecast('rtm', '2026-08-02', '2026-08-03');
  console.log('Intervals count:', res.intervals.length);
  if (res.intervals.length > 0) {
      console.log('Sample interval:', res.intervals[0]);
  }
}
main().catch(console.error).finally(() => process.exit(0));
