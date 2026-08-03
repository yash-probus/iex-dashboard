import { MarketType } from '@prisma/client';
import { iexScraperService } from '../services/iex-scraper.service';

async function run() {
  console.log('Testing scraper for RTM on 2026-07-13...');
  try {
    // We will just call the service, which pulls states from DB
    await iexScraperService.fetchMarketData(MarketType.RTM, '2026-07-13');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    process.exit(0);
  }
}

run();
