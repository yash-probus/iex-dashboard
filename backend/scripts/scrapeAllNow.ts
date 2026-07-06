import { ScraperService } from '../src/modules/scraper/scraper.service';
import { PersistenceService } from '../src/modules/persistence/persistence.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Starting manual Market Data scraper script...');
    
    const deliveryDate = new Date();
    deliveryDate.setUTCHours(0, 0, 0, 0);
    const dateStr = deliveryDate.toISOString().split('T')[0];
    console.log('Persisting data for date:', dateStr);

    try {
      const damRecords = await ScraperService.scrapeDam();
      console.log(`Scraped ${damRecords.length} DAM records.`);
      if (damRecords.length > 0) {
        await PersistenceService.persistDataset({
          market: 'DAM',
          deliveryDate,
          fileName: `scraped_dam_${dateStr}.csv`,
          records: damRecords,
          action: 'replace'
        });
        console.log('Successfully saved DAM data!');
      }
    } catch (e) {
      console.error('DAM Scrape failed:', e);
    }

    try {
      const gdamRecords = await ScraperService.scrapeGdam();
      console.log(`Scraped ${gdamRecords.length} GDAM records.`);
      if (gdamRecords.length > 0) {
        await PersistenceService.persistDataset({
          market: 'GDAM',
          deliveryDate,
          fileName: `scraped_gdam_${dateStr}.csv`,
          records: gdamRecords,
          action: 'replace'
        });
        console.log('Successfully saved GDAM data!');
      }
    } catch (e) {
      console.error('GDAM Scrape failed:', e);
    }

    try {
      const rtmRecords = await ScraperService.scrapeRtm();
      console.log(`Scraped ${rtmRecords.length} RTM records.`);
      if (rtmRecords.length > 0) {
        await PersistenceService.persistDataset({
          market: 'RTM',
          deliveryDate,
          fileName: `scraped_rtm_${dateStr}.csv`,
          records: rtmRecords,
          action: 'replace'
        });
        console.log('Successfully saved RTM data!');
      }
    } catch (e) {
      console.error('RTM Scrape failed:', e);
    }

  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
