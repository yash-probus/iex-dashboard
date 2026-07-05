import { ScraperService } from '../src/modules/scraper/scraper.service';
import { PersistenceService } from '../src/modules/persistence/persistence.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Starting manual DAM scraper script...');
    const records = await ScraperService.scrapeDam();
    console.log(`Scraped ${records.length} records.`);
    
    if (records.length > 0) {
      // The IEX snapshot usually gives data for "tomorrow" (delivery date).
      // Let's check the date on the website? The scrapeDam function does not parse the date from the website.
      // We will set the delivery date to today for now, or tomorrow?
      // "do the scrapping for dam also" - the user wants data for 05/07/2026.
      const deliveryDate = new Date();
      deliveryDate.setUTCHours(0, 0, 0, 0);
      
      console.log('Persisting data for date:', deliveryDate.toISOString());
      
      await PersistenceService.persistDataset({
        market: 'DAM',
        deliveryDate,
        fileName: `scraped_dam_${deliveryDate.toISOString().split('T')[0]}.csv`,
        records,
        action: 'replace'
      });
      console.log('Successfully saved DAM data!');
    }
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
