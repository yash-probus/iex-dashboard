import { Request, Response } from 'express';
import { logger } from '../../logger';
import { ScraperService } from './scraper.service';
import { PersistenceService } from '../persistence/persistence.service';
import { AppError } from '../../utils/AppError';
import prisma from '../../config/prisma';
import { ApiLogService } from '../api-log/api-log.service';

export const triggerScraper = async (req: Request, res: Response) => {
  try {
    const { market } = req.body;
    
    if (!market || !['DAM', 'GDAM', 'RTM', 'REC'].includes(market)) {
      throw new AppError('Invalid market specified. Must be DAM, GDAM, RTM, or REC.', 400);
    }

    logger.info(`Manual scraper triggered for market: ${market}`);
    
    // Scrape Data
    let records: any[] = [];
    if (market === 'DAM') {
      records = await ScraperService.scrapeDam();
    } else if (market === 'GDAM') {
      records = await ScraperService.scrapeGdam();
    } else if (market === 'RTM') {
      records = await ScraperService.scrapeRtm();
    } else if (market === 'REC') {
      records = await ScraperService.scrapeRec();
    }
    
    if (records.length === 0) {
      throw new AppError('Scraper returned 0 records', 500);
    }

    // Persist Data using the existing PersistenceService
    // We'll use the current date as the delivery date for the scraped data
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
      where: { market: market, deliveryDate, status: 'ACTIVE' }
    });

    const dataset = await PersistenceService.persistDataset({
      market: market,
      deliveryDate,
      fileName: `scraped_${market.toLowerCase()}_${dateStr}.csv`,
      records,
      action: existing ? 'replace' : undefined // Auto-replace if it already exists for today, else insert
    });

    await ApiLogService.createLog(`IEX ${market} Scraper`, `https://www.iexindia.com/market-data/${market.toLowerCase()}`, 'SUCCESS', `Successfully scraped and saved ${records.length} records for ${market} (manual trigger)`);

    res.status(200).json({
      success: true,
      message: `Successfully scraped and saved ${records.length} records for ${market}`,
      datasetId: dataset.id
    });
    
  } catch (error: any) {
    logger.error(`Scraper Controller Error: ${error.message}`);
    const marketStr = req.body?.market || 'Unknown';
    await ApiLogService.createLog(`IEX ${marketStr} Scraper`, 'manual-trigger', 'ERROR', error.message || String(error));
    throw error;
  }
};
