import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { VidyutPravahScraper } from './scraper.service';
import { WeatherEngine } from './weather.service';
import { seedCtuCharges } from '../scripts/seed-ctu';

import { ApiLogService } from '../modules/api-log/api-log.service';
import { NppAdjustmentService } from '../modules/dataset/npp-adjustment.service';

import config from '../config';

const prisma = new PrismaClient();

export class CronService {
  public static init() {
    if (!config.runScraper) {
      console.log('[CronService] RUN_SCRAPER is false. Skipping cron jobs initialization.');
      return;
    }
    console.log('[CronService] Initializing background cron jobs...');
    
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      console.log('[Cron] Running 5-minute scheduled tasks');
      try {

        await VidyutPravahScraper.scrapeStateDemand();
      } catch (error) {
        console.error('[Cron] Error in 5-minute schedule:', error);
      }
    });

    // Run every hour for Weather Forecast (Hourly)
    cron.schedule('0 * * * *', async () => {
      console.log('[Cron] Running hourly weather forecast tasks');
      try {
        await WeatherEngine.updateHourlyForecast();
      } catch (error) {
        console.error('[Cron] Error in hourly weather forecast schedule:', error);
      }
    });

    // Run every 30 minutes for RTM Scraper
    cron.schedule('0,30 * * * *', async () => {
      console.log('[Cron] Running hourly RTM scraper');
      try {
        const { ScraperService } = await import('../modules/scraper/scraper.service');
        const { PersistenceService } = await import('../modules/persistence/persistence.service');
        
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const dateStr = formatter.format(new Date());
        const [year, month, day] = dateStr.split('-').map(Number);
        const deliveryDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

        // Scrape and persist RTM
        try {
          const rtmRecords = await ScraperService.scrapeRtm();
          if (rtmRecords.length > 0) {
            const existing = await prisma.dataset.findFirst({
              where: { market: 'RTM', deliveryDate, status: 'ACTIVE' }
            });
            await PersistenceService.persistDataset({
              market: 'RTM',
              deliveryDate,
              fileName: `scraped_rtm_${dateStr}.csv`,
              records: rtmRecords,
              action: existing ? 'replace' : undefined
            });
            console.log(`[Cron] Successfully scraped and saved ${rtmRecords.length} RTM records`);
            await ApiLogService.createLog('IEX RTM Scraper', 'https://www.iexindia.com/market-data/real-time-market/market-snapshot', 'SUCCESS', `Successfully scraped and saved ${rtmRecords.length} RTM records`);
          } else {
            await ApiLogService.createLog('IEX RTM Scraper', 'https://www.iexindia.com/market-data/real-time-market/market-snapshot', 'SUCCESS', 'Scraper returned 0 records');
          }
        } catch (e: any) {
          console.error('[Cron] RTM scrape failed:', e);
          await ApiLogService.createLog('IEX RTM Scraper', 'https://www.iexindia.com/market-data/real-time-market/market-snapshot', 'ERROR', e.message || String(e));
        }
      } catch (error) {
        console.error('[Cron] Error in hourly RTM scraper schedule:', error);
      }
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Run every day at midnight for Weather Historical
    cron.schedule('0 0 * * *', async () => {
      console.log('[Cron] Running daily midnight tasks');
      try {
        await WeatherEngine.updateDailyHistorical();
      } catch (error) {
        console.error('[Cron] Error in daily schedule:', error);
      }
    }, {
      timezone: 'Asia/Kolkata'
    });
    

    // Run on the 1st of every month at 2:00 AM for CTU Charges
    cron.schedule('0 2 1 * *', async () => {
      console.log('[Cron] Running monthly CTU charges schedule');
      try {
        await seedCtuCharges();
      } catch (error) {
        console.error('[Cron] Error in monthly CTU schedule:', error);
      }
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Run every day at 7:00 AM for Market Data (DAM, GDAM, RTM) Scrapers
    cron.schedule('0 7 * * *', async () => {
      console.log('[Cron] Running daily Market Data scrapers at 7 AM');
      try {
        const { ScraperService } = await import('../modules/scraper/scraper.service');
        const { PersistenceService } = await import('../modules/persistence/persistence.service');
        
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const dateStr = formatter.format(new Date());
        const [year, month, day] = dateStr.split('-').map(Number);
        const deliveryDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

        // Scrape and persist DAM
        try {
          const damRecords = await ScraperService.scrapeDam();
          if (damRecords.length > 0) {
            const existing = await prisma.dataset.findFirst({
              where: { market: 'DAM', deliveryDate, status: 'ACTIVE' }
            });
            await PersistenceService.persistDataset({
              market: 'DAM',
              deliveryDate,
              fileName: `scraped_dam_${dateStr}.csv`,
              records: damRecords,
              action: existing ? 'replace' : undefined
            });
            console.log(`[Cron] Successfully scraped and saved ${damRecords.length} DAM records`);
            await ApiLogService.createLog('IEX DAM Scraper', 'https://www.iexindia.com/market-data/day-ahead-market/market-snapshot', 'SUCCESS', `Successfully scraped and saved ${damRecords.length} DAM records`);
          } else {
            await ApiLogService.createLog('IEX DAM Scraper', 'https://www.iexindia.com/market-data/day-ahead-market/market-snapshot', 'SUCCESS', 'Scraper returned 0 records');
          }
        } catch (e: any) {
          console.error('[Cron] DAM scrape failed:', e);
          await ApiLogService.createLog('IEX DAM Scraper', 'https://www.iexindia.com/market-data/day-ahead-market/market-snapshot', 'ERROR', e.message || String(e));
        }

        // Scrape and persist GDAM
        try {
          const gdamRecords = await ScraperService.scrapeGdam();
          if (gdamRecords.length > 0) {
            const existing = await prisma.dataset.findFirst({
              where: { market: 'GDAM', deliveryDate, status: 'ACTIVE' }
            });
            await PersistenceService.persistDataset({
              market: 'GDAM',
              deliveryDate,
              fileName: `scraped_gdam_${dateStr}.csv`,
              records: gdamRecords,
              action: existing ? 'replace' : undefined
            });
            console.log(`[Cron] Successfully scraped and saved ${gdamRecords.length} GDAM records`);
            await ApiLogService.createLog('IEX GDAM Scraper', 'https://www.iexindia.com/market-data/green-day-ahead-market/market-snapshot', 'SUCCESS', `Successfully scraped and saved ${gdamRecords.length} GDAM records`);
          } else {
            await ApiLogService.createLog('IEX GDAM Scraper', 'https://www.iexindia.com/market-data/green-day-ahead-market/market-snapshot', 'SUCCESS', 'Scraper returned 0 records');
          }
        } catch (e: any) {
          console.error('[Cron] GDAM scrape failed:', e);
          await ApiLogService.createLog('IEX GDAM Scraper', 'https://www.iexindia.com/market-data/green-day-ahead-market/market-snapshot', 'ERROR', e.message || String(e));
        }

        // RTM scraper has been moved to an hourly cron job

      } catch (error) {
        console.error('[Cron] Error in Market Data scraper schedule:', error);
      }
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Run every 4 minutes for NPP Data
    cron.schedule('*/4 * * * *', async () => {
      console.log('[Cron] Running 4-minute scheduled tasks');
      try {
        // Real time NPP demand
        const dateStr = new Date().toISOString().split('T')[0];
        const data = await VidyutPravahScraper.getNppDemandData(dateStr);
        
        if (data && data.length > 0) {
          await prisma.nppRawDemandData.createMany({
            data: data.map(d => ({
              date: d.date,
              timeStr: d.timeStr,
              demandMet: d.demandMet,
              dataUpdatedAt: d.dataUpdatedAt,
              fetchedAt: new Date(),
            })),
            skipDuplicates: true
          });
          console.log(`[CronService] Polled NPP Demand for ${dateStr} -> ${data.length} records`);
          await NppAdjustmentService.updateAdjustedDemandForDate(dateStr);
        }
        
        // Real time NPP generation
        const genData = await VidyutPravahScraper.getNppGenerationData(dateStr);
        if (genData && genData.length > 0) {
          await prisma.nppRawGenerationData.createMany({
            data: genData.map(g => ({
              date: g.date,
              timeStr: g.timeStr,
              thermal: g.thermal,
              gas: g.gas,
              nuclear: g.nuclear,
              hydro: g.hydro,
              wind: g.wind,
              solar: g.solar,
              dataUpdatedAt: g.dataUpdatedAt,
              fetchedAt: new Date(),
            })),
            skipDuplicates: true
          });
          console.log(`[CronService] Polled NPP Generation for ${dateStr} -> ${genData.length} records`);
          await NppAdjustmentService.updateAdjustedGenerationForDate(dateStr);
        }
      } catch (error) {
        console.error('[Cron] Error in 4-minute schedule:', error);
      }
    });

    console.log('[CronService] Cron jobs initialized successfully.');
  }

}
