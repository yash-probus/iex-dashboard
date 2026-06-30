import puppeteer from 'puppeteer';
import { DamIntervalRecord, GdamIntervalRecord, RtmIntervalRecord } from '../transformation/transformation.types';
import { logger } from '../../logger';

export class ScraperService {
  private static parseNumber(val: string): number {
    if (!val || val === '-') return 0;
    return parseFloat(val.replace(/,/g, ''));
  }

  public static async scrapeDam(): Promise<DamIntervalRecord[]> {
    logger.info('Starting Puppeteer for DAM Market Data Scrape...');
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.goto('https://www.iexindia.com/market-data/day-ahead-market/market-snapshot', { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });

      await page.waitForSelector('table', { timeout: 15000 });

      const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map(row => {
          const columns = Array.from(row.querySelectorAll('td'));
          return columns.map(c => c.innerText.trim());
        });
      });

      const records: DamIntervalRecord[] = [];
      let currentHour = 1;

      for (const row of data) {
        let timeBlock, pb, sb, mcv, fsv, mcp;

        if (row.length === 8) {
          currentHour = parseInt(row[1], 10);
          timeBlock = row[2];
          pb = row[3];
          sb = row[4];
          mcv = row[5];
          fsv = row[6];
          mcp = row[7];
        } else if (row.length === 6) {
          timeBlock = row[0];
          pb = row[1];
          sb = row[2];
          mcv = row[3];
          fsv = row[4];
          mcp = row[5];
        } else {
          continue; 
        }

        const [start] = timeBlock.split(' - ');
        if (!start) continue;
        const [hh, mm] = start.split(':').map(Number);
        
        const intervalNumber = (hh * 4) + (mm / 15) + 1;

        records.push({
          intervalNumber,
          intervalTime: timeBlock,
          purchaseBid: this.parseNumber(pb),
          sellBid: this.parseNumber(sb),
          mcv: this.parseNumber(mcv),
          fsv: this.parseNumber(fsv),
          mcp: this.parseNumber(mcp),
        });
      }

      logger.info(`Successfully scraped ${records.length} DAM records`);
      return records;

    } catch (error: any) {
      logger.error(`Error scraping DAM: ${error.message}`);
      throw error;
    } finally {
      await browser.close();
    }
  }

  public static async scrapeGdam(): Promise<GdamIntervalRecord[]> {
    throw new Error('GDAM Scraping not yet implemented in MVP');
  }

  public static async scrapeRtm(): Promise<RtmIntervalRecord[]> {
     throw new Error('RTM Scraping not yet implemented in MVP');
  }
}
