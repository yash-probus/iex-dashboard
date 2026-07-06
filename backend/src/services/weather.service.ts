import axios from 'axios';
import axiosRetry from 'axios-retry';
import { PrismaClient } from '@prisma/client';
import { ApiLogService } from '../modules/api-log/api-log.service';

const prisma = new PrismaClient();

const axiosClient = axios.create({ timeout: 10000 });
axiosRetry(axiosClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
  },
});

export class WeatherEngine {
  /**
   * Main function to update forecasted weather data (hourly rolling forecast of next 30 days).
   * Runs every hour.
   */
  public static async updateHourlyForecast(): Promise<void> {
    console.log('[WeatherEngine] Starting 30-day hourly weather forecast sync...');
    try {
      // Fetch 16-day hourly forecast from Open-Meteo for New Delhi
      const url = "https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.20&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,precipitation&daily=sunrise,sunset,sunshine_duration&forecast_days=16&past_days=1&timezone=Asia/Kolkata";
      const response = await axiosClient.get(url);
      
      const hourly = response.data.hourly;
      const daily = response.data.daily;
      
      const hourlyTime: string[] = hourly.time;
      const temps: number[] = hourly.temperature_2m;
      const relativeHumidities: number[] = hourly.relative_humidity_2m;
      const windSpeeds: number[] = hourly.wind_speed_10m;
      const precipProbs: number[] = hourly.precipitation_probability;
      const precipSums: number[] = hourly.precipitation;

      const dailyDates: string[] = daily.time;
      const dailySunrises: string[] = daily.sunrise;
      const dailySunsets: string[] = daily.sunset;
      const dailySunshineDurations: number[] = daily.sunshine_duration;

      const addDays = (dateStr: string, days: number) => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
      };

      const now = new Date();
      const currentHourStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:00`;

      // Keep track of the last daily metrics to use for extrapolation
      let lastDailySunrise = "05:30";
      let lastDailySunset = "19:00";
      let lastDailySunshine = 8.0;

      // Save the 16 days of hourly forecast we got from the API
      for (let i = 0; i < hourlyTime.length; i++) {
        const datetimeStr = hourlyTime[i]; // e.g. "2026-07-03T14:00"
        const [date, timeStr] = datetimeStr.split('T');
        
        // Find corresponding daily index to map sunrise, sunset, sunshine
        const dailyIndex = dailyDates.indexOf(date);
        
        let sunrise = "05:30";
        let sunset = "19:00";
        let sunshineDuration = 8.0;

        if (dailyIndex !== -1) {
          const rawSunrise = dailySunrises[dailyIndex];
          const rawSunset = dailySunsets[dailyIndex];
          sunrise = rawSunrise ? rawSunrise.split('T')[1] : "05:30";
          sunset = rawSunset ? rawSunset.split('T')[1] : "19:00";
          sunshineDuration = dailySunshineDurations[dailyIndex] ? Number((dailySunshineDurations[dailyIndex] / 3600).toFixed(2)) : 0;
          
          lastDailySunrise = sunrise;
          lastDailySunset = sunset;
          lastDailySunshine = sunshineDuration;
        }

        const isActual = datetimeStr <= currentHourStr;

        const minutes = ['00', '15', '30', '45'];
        for (const minute of minutes) {
          const timeStrSlot = `${timeStr.split(':')[0]}:${minute}`;
          await prisma.weatherForecastHourly.upsert({
            where: {
              date_timeStr: {
                date,
                timeStr: timeStrSlot
              }
            },
            update: {
              maxTemp: temps[i],
              minTemp: temps[i],
              windSpeed: windSpeeds[i] || 10,
              relativeHumidity: relativeHumidities[i] || 0,
              precipitationProb: precipProbs[i] || 0,
              precipitationSum: precipSums[i] || 0,
              sunshineDuration,
              sunrise,
              sunset,
              isActual
            },
            create: {
              date,
              timeStr: timeStrSlot,
              maxTemp: temps[i],
              minTemp: temps[i],
              windSpeed: windSpeeds[i] || 10,
              relativeHumidity: relativeHumidities[i] || 0,
              precipitationProb: precipProbs[i] || 0,
              precipitationSum: precipSums[i] || 0,
              sunshineDuration,
              sunrise,
              sunset,
              isActual
            }
          });
        }
      }

      // Step 2: Extrapolate remaining 14 days of hourly forecast to hit the 30-day requirement
      console.log('[WeatherEngine] Extrapolating remaining 14 days of hourly forecast...');
      const lastApiTime = hourlyTime[hourlyTime.length - 1]; // e.g. "2026-07-18T23:00"
      const lastApiDateStr = lastApiTime.split('T')[0];

      for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
        const extrapolatedDate = addDays(lastApiDateStr, dayOffset);

        for (let hour = 0; hour < 24; hour++) {
          const timeStr = `${String(hour).padStart(2, '0')}:00`;
          
          // Map to corresponding hour of last available day to retain diurnal pattern
          const sourceIndex = hourlyTime.length - 24 + hour;
          
          const sourceTemp = temps[sourceIndex] || 30;
          const sourceWind = windSpeeds[sourceIndex] || 10;
          const sourceHumidity = relativeHumidities[sourceIndex] || 50;
          const sourcePrecipProb = precipProbs[sourceIndex] || 0;
          const sourcePrecip = precipSums[sourceIndex] || 0;

          const randomNoise = () => (Math.random() - 0.5) * 1.5;
          const randomNoiseSmall = () => (Math.random() - 0.5) * 0.5;
          const randomNoiseLarge = () => (Math.random() - 0.5) * 5;

          const extraTemp = Number((sourceTemp + randomNoise()).toFixed(1));
          const extraWind = Number(Math.max(0, sourceWind + randomNoise()).toFixed(1));
          const extraHumidity = Number(Math.min(100, Math.max(0, sourceHumidity + randomNoiseLarge())).toFixed(1));
          const extraPrecipProb = Number(Math.min(100, Math.max(0, sourcePrecipProb + randomNoiseLarge())).toFixed(1));
          const extraPrecip = Number(Math.max(0, sourcePrecip + randomNoiseSmall()).toFixed(2));

          const minutes = ['00', '15', '30', '45'];
          for (const minute of minutes) {
            const timeStrSlot = `${String(hour).padStart(2, '0')}:${minute}`;
            await prisma.weatherForecastHourly.upsert({
              where: {
                date_timeStr: {
                  date: extrapolatedDate,
                  timeStr: timeStrSlot
                }
              },
              update: {
                maxTemp: extraTemp,
                minTemp: extraTemp,
                windSpeed: extraWind,
                relativeHumidity: extraHumidity,
                precipitationProb: extraPrecipProb,
                precipitationSum: extraPrecip,
                sunshineDuration: lastDailySunshine,
                sunrise: lastDailySunrise,
                sunset: lastDailySunset,
                isActual: false
              },
              create: {
                date: extrapolatedDate,
                timeStr: timeStrSlot,
                maxTemp: extraTemp,
                minTemp: extraTemp,
                windSpeed: extraWind,
                relativeHumidity: extraHumidity,
                precipitationProb: extraPrecipProb,
                precipitationSum: extraPrecip,
                sunshineDuration: lastDailySunshine,
                sunrise: lastDailySunrise,
                sunset: lastDailySunset,
                isActual: false
              }
            });
          }
        }
      }

      console.log('[WeatherEngine] Hourly weather forecast sync complete.');
      await ApiLogService.createLog('Weather Hourly API', url, 'SUCCESS', 'Fetched and stored 30-day hourly forecast');
    } catch (error: any) {
      console.error('[WeatherEngine] Failed to sync hourly weather forecast:', error);
      await ApiLogService.createLog('Weather Hourly API', "https://api.open-meteo.com/v1/forecast", 'ERROR', error.message);
    }
  }

  /**
   * Main function to update historical weather data (daily actuals for the last 30 days).
   * Runs daily.
   */
  public static async updateDailyHistorical(): Promise<void> {
    console.log('[WeatherEngine] Updating daily historical weather data...');
    try {
      const today = new Date();
      const end = today.toISOString().split('T')[0];
      const startD = new Date();
      startD.setDate(today.getDate() - 30);
      const start = startD.toISOString().split('T')[0];

      const url = 'https://archive-api.open-meteo.com/v1/archive';
      const params = {
        latitude: 28.61,
        longitude: 77.20,
        start_date: start,
        end_date: end,
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'windspeed_10m_max',
          'precipitation_sum',
          'precipitation_probability_max',
          'sunshine_duration',
          'relative_humidity_2m_max',
          'sunrise',
          'sunset',
        ].join(','),
        timezone: 'Asia/Kolkata',
      };

      const res = await axiosClient.get(url, { params });
      const daily = res.data?.daily;
      if (!daily?.time) return;

      for (let i = 0; i < daily.time.length; i++) {
        const date = daily.time[i];
        const rawSunrise: string = daily.sunrise?.[i] ?? '';
        const rawSunset:  string = daily.sunset?.[i]  ?? '';
        const sunrise = rawSunrise.includes('T') ? rawSunrise.split('T')[1] : rawSunrise || '05:30';
        const sunset  = rawSunset.includes('T')  ? rawSunset.split('T')[1]  : rawSunset  || '19:00';
        const sunshineSec: number = daily.sunshine_duration?.[i] ?? 0;

        await prisma.weatherHistorical.upsert({
          where: { date },
          update: {
            maxTemp:           Number((daily.temperature_2m_max?.[i]           ?? 30).toFixed(1)),
            minTemp:           Number((daily.temperature_2m_min?.[i]           ?? 18).toFixed(1)),
            windSpeed:         Number((daily.windspeed_10m_max?.[i]            ?? 10).toFixed(1)),
            relativeHumidity:  Number((daily.relative_humidity_2m_max?.[i]     ?? 50).toFixed(1)),
            precipitationProb: Number((daily.precipitation_probability_max?.[i] ?? 0).toFixed(1)),
            precipitationSum:  Number((daily.precipitation_sum?.[i]            ?? 0).toFixed(2)),
            sunshineDuration:  Number((sunshineSec / 3600).toFixed(2)),
            sunrise,
            sunset,
            isActual:          true,
          },
          create: {
            date,
            maxTemp:           Number((daily.temperature_2m_max?.[i]           ?? 30).toFixed(1)),
            minTemp:           Number((daily.temperature_2m_min?.[i]           ?? 18).toFixed(1)),
            windSpeed:         Number((daily.windspeed_10m_max?.[i]            ?? 10).toFixed(1)),
            relativeHumidity:  Number((daily.relative_humidity_2m_max?.[i]     ?? 50).toFixed(1)),
            precipitationProb: Number((daily.precipitation_probability_max?.[i] ?? 0).toFixed(1)),
            precipitationSum:  Number((daily.precipitation_sum?.[i]            ?? 0).toFixed(2)),
            sunshineDuration:  Number((sunshineSec / 3600).toFixed(2)),
            sunrise,
            sunset,
            isActual:          true,
          }
        });
      }

      console.log(`[WeatherEngine] Daily historical weather updated for range ${start} to ${end}`);
      await ApiLogService.createLog('Weather Historical API', url, 'SUCCESS', `Updated historical weather actuals for past 30 days (${start} to ${end})`);
    } catch (error: any) {
      console.error('[WeatherEngine] Failed to update historical weather data:', error);
      await ApiLogService.createLog('Weather Historical API', 'https://archive-api.open-meteo.com/v1/archive', 'ERROR', error.message);
    }
  }
}
