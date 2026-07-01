import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { VidyutPravahScraper } from './scraper.service';
import { WeatherEngine } from './weather.service';
import { seedCtuCharges } from '../scripts/seed-ctu';
import { seedIstsCharges } from '../scripts/seed-ists';

const prisma = new PrismaClient();

export class CronService {
  public static init() {
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

    // Run every day at midnight for Weather Actuals + Forecast
    cron.schedule('0 0 * * *', async () => {
      console.log('[Cron] Running daily midnight tasks');
      try {
        await WeatherEngine.updateWeatherForecasts();
      } catch (error) {
        console.error('[Cron] Error in daily schedule:', error);
      }
    });
    
    // Run every 7 days (Weekly on Sunday at 1:00 AM) for ISTS Transmission Losses
    cron.schedule('0 1 * * 0', async () => {
      console.log('[Cron] Running weekly ISTS (Transmission Losses) schedule');
      try {
        await seedIstsCharges();
      } catch (error) {
        console.error('[Cron] Error in weekly ISTS schedule:', error);
      }
    });

    // Run on the 1st of every month at 2:00 AM for CTU Charges
    cron.schedule('0 2 1 * *', async () => {
      console.log('[Cron] Running monthly CTU charges schedule');
      try {
        await seedCtuCharges();
      } catch (error) {
        console.error('[Cron] Error in monthly CTU schedule:', error);
      }
    });

    // Run every 4 minutes for NPP Data
    cron.schedule('*/4 * * * *', async () => {
      console.log('[Cron] Running 4-minute scheduled tasks');
      try {
        // Real time NPP demand
        const dateStr = new Date().toISOString().split('T')[0];
        const data = await VidyutPravahScraper.getNppDemandData(dateStr);
        
        if (data) {
          await prisma.nppRawDemandData.create({
            data: {
              date: data.date,
              timeStr: data.timeStr,
              demandMet: data.demandMet,
              dataUpdatedAt: data.dataUpdatedAt,
              fetchedAt: new Date(),
            }
          });
          console.log(`[CronService] Polled NPP Demand for ${data.timeStr} -> ${data.demandMet} MW`);
        }
        
        // Real time NPP generation
        const genData = await VidyutPravahScraper.getNppGenerationData(dateStr);
        if (genData) {
          await prisma.nppRawGenerationData.create({
            data: {
              date: genData.date,
              timeStr: genData.timeStr,
              thermal: genData.thermal,
              gas: genData.gas,
              nuclear: genData.nuclear,
              hydro: genData.hydro,
              wind: genData.wind,
              solar: genData.solar,
              dataUpdatedAt: genData.dataUpdatedAt,
              fetchedAt: new Date(),
            }
          });
          console.log(`[CronService] Polled NPP Generation for ${genData.timeStr} -> Thermal: ${genData.thermal} MW`);
        }
      } catch (error) {
        console.error('[Cron] Error in 4-minute schedule:', error);
      }
    });

    console.log('[CronService] Cron jobs initialized successfully.');
  }

}
