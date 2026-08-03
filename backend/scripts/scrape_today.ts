import { iexScraperService } from '../src/services/iex-scraper.service';
import { MarketType } from '@prisma/client';
import prisma from '../src/config/prisma';

async function main() {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  console.log(`Running manual scrape for today (${today})...`);
  
  try {
    console.log('Scraping DAM...');
    await iexScraperService.fetchMarketData(MarketType.DAM, today);
  } catch (e) {
    console.error('DAM failed:', e);
  }

  try {
    console.log('Scraping GDAM...');
    await iexScraperService.fetchMarketData(MarketType.GDAM, today);
  } catch (e) {
    console.error('GDAM failed:', e);
  }

  try {
    console.log('Scraping RTM...');
    await iexScraperService.fetchMarketData(MarketType.RTM, today);
  } catch (e) {
    console.error('RTM failed:', e);
  }

  console.log('Manual scrape completed.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
