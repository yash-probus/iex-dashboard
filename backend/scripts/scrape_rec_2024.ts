import { ScraperService } from '../src/modules/scraper/scraper.service';
import { PersistenceService } from '../src/modules/persistence/persistence.service';
import prisma from '../src/config/prisma';

async function main() {
  try {
    console.log('Fetching REC data...');
    const records = await ScraperService.scrapeRec();
    console.log(`Fetched ${records.length} total REC records.`);

    const filteredRecords = records.filter((r: any) => r.year >= 2024);
    console.log(`Filtered down to ${filteredRecords.length} records from 2024 onwards.`);

    if (filteredRecords.length === 0) {
      console.log('No records found for >= 2024. Exiting.');
      return;
    }

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const dateStr = formatter.format(new Date());
    const [year, month, day] = dateStr.split('-').map(Number);
    const deliveryDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    const existing = await prisma.dataset.findFirst({
      where: { market: 'REC', deliveryDate, status: 'ACTIVE' }
    });

    console.log('Persisting dataset...');
    await PersistenceService.persistDataset({
      market: 'REC',
      deliveryDate,
      fileName: `scraped_rec_${dateStr}.csv`,
      records: filteredRecords,
      action: existing ? 'replace' : undefined
    });

    console.log('Successfully saved REC data from 2024 till now.');
  } catch (err) {
    console.error('Error scraping/saving REC data:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
