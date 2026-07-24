import { MarketType } from '@prisma/client';
import { iexScraperService } from '../src/services/iex-scraper.service';

async function run() {
  const startDate = new Date('2026-07-13');
  const endDate = new Date();
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    console.log(`Scraping GDAM for ${dateStr}...`);
    try {
      await iexScraperService.fetchMarketData(MarketType.GDAM, dateStr);
      console.log(`Successfully scraped GDAM for ${dateStr}`);
    } catch (e) {
      console.error(`Failed to scrape GDAM for ${dateStr}:`, e);
    }
  }
}

run().catch(console.error).finally(() => process.exit(0));
