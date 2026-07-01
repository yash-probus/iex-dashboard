import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { VidyutPravahScraper } from './scraper.service';
import { WeatherEngine } from './weather.service';

const prisma = new PrismaClient();

export class CronService {
  public static init() {
    console.log('[CronService] Initializing background cron jobs...');
    
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      console.log('[Cron] Running 5-minute scheduled tasks');
      try {
        await CronService.fetchAndRoundNppData();
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
    console.log('[CronService] Cron jobs initialized successfully.');
  }

  public static async fetchAndRoundNppData() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const rawHours = now.getHours();
    const rawMinutes = now.getMinutes();
    const rawTimeStr = `${rawHours.toString().padStart(2, '0')}:${rawMinutes.toString().padStart(2, '0')}`;

    // 1. Fetch REAL demand from scraper
    const demandMet = await VidyutPravahScraper.getLiveAllIndiaDemand();
    if (!demandMet) {
      console.error('[CronService] Could not fetch All India demand. Skipping.');
      return;
    }
    
    // Simulate generation sources since API doesn't provide them
    const hydro = Math.round(demandMet * 0.15);
    const wind = Math.round(demandMet * 0.08);
    const gas = Math.round(demandMet * 0.05);
    const nuclear = Math.round(demandMet * 0.03);
    const solar = Math.max(0, Math.round(demandMet * 0.12) - (Math.abs(12 - rawHours) * 1000));
    const thermal = Math.round(demandMet - (hydro + wind + gas + solar + nuclear));

    const rawData = {
      date: dateStr,
      timeStr: rawTimeStr,
      demandMet,
      hydro,
      wind,
      gas,
      solar,
      nuclear,
      thermal,
    };

    // Save RAW Data
    await prisma.nppRawDemandData.create({
      data: rawData
    });
    console.log(`[CronService] Saved RAW data at ${rawTimeStr}`);

    // 2. Calculate rounded time (round up to nearest 5 minutes)
    // Example: 09 -> 10, 13 -> 15, 14 -> 15, 16 -> 20
    const remainder = rawMinutes % 5;
    let roundedMinutes = rawMinutes;
    let roundedHours = rawHours;

    if (remainder !== 0) {
      roundedMinutes = rawMinutes + (5 - remainder);
      if (roundedMinutes >= 60) {
        roundedMinutes = 0;
        roundedHours = (roundedHours + 1) % 24;
      }
    }

    const roundedTimeStr = `${roundedHours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;

    // 3. Save STANDARDIZED (Rounded) Data
    const standardizedData = {
      ...rawData,
      timeStr: roundedTimeStr
    };

    await prisma.nppDemandData.upsert({
      where: {
        date_timeStr: {
          date: dateStr,
          timeStr: roundedTimeStr
        }
      },
      update: standardizedData,
      create: standardizedData,
    });
    console.log(`[CronService] Saved STANDARDIZED data at ${roundedTimeStr}`);

    // 4. Log the Transformation
    await prisma.dataRoundingLog.create({
      data: {
        rawTimeStr,
        roundedTimeStr,
        date: dateStr
      }
    });
    console.log(`[CronService] Logged rounding transformation: ${rawTimeStr} -> ${roundedTimeStr}`);
  }
}
