require('dotenv').config();
const { ScraperService } = require('./src/modules/scraper/scraper.service');

(async () => {
  try {
    const records = await ScraperService.scrapeRec();
    console.log(`Scraped ${records.length} REC records!`);
    if (records.length > 0) {
      console.log('First Record:', records[0]);
    }
  } catch (err) {
    console.error('Test Failed:', err);
  }
})();
