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
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
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
    logger.info('Starting Puppeteer for GDAM Market Data Scrape...');
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      await page.goto('https://www.iexindia.com/market-data/green-day-ahead-market/market-snapshot', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await page.waitForSelector('table', { timeout: 15000 });

      const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map(row => {
          const columns = Array.from(row.querySelectorAll('td'));
          return columns.map(c => (c as HTMLElement).innerText.trim());
        });
      });

      const records: GdamIntervalRecord[] = [];
      for (const row of data) {
        // Expect columns: TimeBlock, PurchaseBid, SellBidTotal, SellBidSolar, SellBidNonSolar, SellBidHydro,
        //                 MCVTotal, MCVSolar, MCVNonSolar, MCVHydro, FSVTotal, FSVSolar, FSVNonSolar, FSVHydro, MCP
        if (row.length < 2) continue;
        const timeBlock = row[0];
        if (!timeBlock || !timeBlock.includes(':')) continue;
        const [start] = timeBlock.split(' - ');
        if (!start) continue;
        const [hh, mm] = start.split(':').map(Number);
        const intervalNumber = (hh * 4) + (mm / 15) + 1;

        records.push({
          intervalNumber,
          intervalTime: timeBlock,
          purchaseBid:    this.parseNumber(row[1]  ?? '0'),
          sellBidTotal:   this.parseNumber(row[2]  ?? '0'),
          sellBidSolar:   this.parseNumber(row[3]  ?? '0'),
          sellBidNonSolar:this.parseNumber(row[4]  ?? '0'),
          sellBidHydro:   this.parseNumber(row[5]  ?? '0'),
          mcvTotal:       this.parseNumber(row[6]  ?? '0'),
          mcvSolar:       this.parseNumber(row[7]  ?? '0'),
          mcvNonSolar:    this.parseNumber(row[8]  ?? '0'),
          mcvHydro:       this.parseNumber(row[9]  ?? '0'),
          fsvTotal:       this.parseNumber(row[10] ?? '0'),
          fsvSolar:       this.parseNumber(row[11] ?? '0'),
          fsvNonSolar:    this.parseNumber(row[12] ?? '0'),
          fsvHydro:       this.parseNumber(row[13] ?? '0'),
          mcp:            this.parseNumber(row[14] ?? '0'),
        });
      }

      logger.info(`Successfully scraped ${records.length} GDAM records`);
      return records;

    } catch (error: any) {
      logger.error(`Error scraping GDAM: ${error.message}`);
      throw error;
    } finally {
      await browser.close();
    }
  }

  public static async scrapeRtm(): Promise<RtmIntervalRecord[]> {
    logger.info('Starting Puppeteer for RTM Market Data Scrape...');
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      await page.goto('https://www.iexindia.com/market-data/real-time-market/market-snapshot', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await page.waitForSelector('table', { timeout: 15000 });

      const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map(row => {
          const columns = Array.from(row.querySelectorAll('td'));
          return columns.map(c => (c as HTMLElement).innerText.trim());
        });
      });

      const records: RtmIntervalRecord[] = [];
      let intervalNumber = 1;

      for (const row of data) {
        if (row.length < 5) continue;
        const timeBlock = row[0];
        if (!timeBlock || !timeBlock.includes(':')) continue;

        records.push({
          intervalNumber: intervalNumber++,
          intervalTime: timeBlock.split('-')[0]?.trim() || timeBlock,
          sessionId: '1',
          purchaseBid: this.parseNumber(row[1] ?? '0'),
          sellBid:     this.parseNumber(row[2] ?? '0'),
          mcv:         this.parseNumber(row[3] ?? '0'),
          fsv:         this.parseNumber(row[4] ?? '0'),
          mcp:         this.parseNumber(row[5] ?? '0'),
        });
      }

      logger.info(`Successfully scraped ${records.length} RTM records`);
      return records;

    } catch (error: any) {
      logger.error(`Error scraping RTM: ${error.message}`);
      throw error;
    } finally {
      await browser.close();
    }
  }
}
