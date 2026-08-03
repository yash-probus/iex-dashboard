import { MarketType } from '@prisma/client';
import { iexScraperService } from '../services/iex-scraper.service';

async function run() {
  const todayStr = new Date().toISOString().split('T')[0];
  console.log(`Testing scraper for RTM on ${todayStr}...`);
  try {
    // We will just call the service, which pulls states from DB
    await iexScraperService.fetchMarketData(MarketType.RTM, todayStr);
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    process.exit(0);
  }
}

run();
