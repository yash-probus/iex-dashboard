import { Request, Response } from 'express';
import { logger } from '../../logger';
import { ScraperService } from './scraper.service';
import { PersistenceService } from '../persistence/persistence.service';
import { AppError } from '../../utils/AppError';

export const triggerScraper = async (req: Request, res: Response) => {
  try {
    const { market } = req.body;
    
    if (!market || market !== 'DAM') {
      throw new AppError('Currently only DAM market scraping is supported', 400);
    }

    logger.info(`Manual scraper triggered for market: ${market}`);
    
    // Scrape Data
    const records = await ScraperService.scrapeDam();
    
    if (records.length === 0) {
      throw new AppError('Scraper returned 0 records', 500);
    }

    // Persist Data using the existing PersistenceService
    // We'll use the current date as the delivery date for the scraped data
    const deliveryDate = new Date();
    // Normalize to midnight UTC for deliveryDate
    deliveryDate.setUTCHours(0, 0, 0, 0);

    const dataset = await PersistenceService.persistDataset({
      market: 'DAM',
      deliveryDate,
      fileName: `scraped_dam_${deliveryDate.toISOString().split('T')[0]}.csv`,
      records,
      action: 'replace' // Auto-replace if it already exists for today
    });

    res.status(200).json({
      success: true,
      message: `Successfully scraped and saved ${records.length} records for ${market}`,
      datasetId: dataset.id
    });
    
  } catch (error: any) {
    logger.error(`Scraper Controller Error: ${error.message}`);
    throw error;
  }
};
