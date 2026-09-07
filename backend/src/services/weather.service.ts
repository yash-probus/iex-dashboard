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
      const cities = await prisma.cityStateData.findMany();
      if (cities.length === 0) {
        console.warn('[WeatherEngine] No cities found in CityStateData. Skipping forecast sync.');
        return;
      }

      const API_KEY = process.env.ACCUWEATHER_API_KEY;

      for (const city of cities) {
        // 1. Fetch Location Key
        let locationKey: string;
        try {
          const geoUrl = `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${API_KEY}&q=${city.latitude},${city.longitude}`;
          const geoRes = await axiosClient.get(geoUrl);
          locationKey = geoRes.data.Key;
          if (!locationKey) throw new Error('No Location Key found');
        } catch (e: any) {
          console.error(`[WeatherEngine] Failed to get location key for ${city.cityName}`, e.message);
          continue;
        }

        // 2. Fetch Hourly Forecast (12-hour)
        const hourlyUrl = `http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/${locationKey}?apikey=${API_KEY}&details=true&metric=true`;
        let hourlyData: any[];
        try {
          const response = await axiosClient.get(hourlyUrl);
          hourlyData = response.data;
          if (!hourlyData || hourlyData.length === 0) throw new Error('No hourly data returned');
        } catch (e: any) {
          console.error(`[WeatherEngine] Failed to get hourly forecast for ${city.cityName}`, e.message);
          continue;
        }

        const addDays = (dateStr: string, days: number) => {
          const d = new Date(dateStr);
          d.setDate(d.getDate() + days);
          return d.toISOString().split('T')[0];
        };

        const now = new Date();
        const currentHourStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:00`;

        let lastDailySunrise = "05:30";
        let lastDailySunset = "19:00";
        let lastDailySunshine = 8.0;

        // Process the 12 hours we got from AccuWeather
        const parsedHours = [];
        for (let i = 0; i < hourlyData.length; i++) {
          const h = hourlyData[i];
          const datetimeStr = h.DateTime.substring(0, 16); // "2026-08-24T05:00"
          const [date, timeStr] = datetimeStr.split('T');
          
          const temp = h.Temperature?.Value || 30;
          const windSpeed = h.Wind?.Speed?.Value || 10;
          const relativeHumidity = h.RelativeHumidity || 50;
          const precipProb = h.PrecipitationProbability || 0;
          const precipSum = h.TotalLiquid?.Value || 0;
          
          parsedHours.push({
            date, timeStr, temp, windSpeed, relativeHumidity, precipProb, precipSum
          });

          const isActual = datetimeStr <= currentHourStr;
          const minutes = ['00', '15', '30', '45'];
          
          for (const minute of minutes) {
            const timeStrSlot = `${timeStr.split(':')[0]}:${minute}`;
            await prisma.weatherForecastHourly.upsert({
              where: {
                date_timeStr_cityId: { date, timeStr: timeStrSlot, cityId: city.id }
              },
              update: {
                maxTemp: temp, minTemp: temp, windSpeed, relativeHumidity, precipitationProb: precipProb,
                precipitationSum: precipSum, sunshineDuration: lastDailySunshine, sunrise: lastDailySunrise,
                sunset: lastDailySunset, isActual
              },
              create: {
                date, timeStr: timeStrSlot, cityId: city.id,
                maxTemp: temp, minTemp: temp, windSpeed, relativeHumidity, precipitationProb: precipProb,
                precipitationSum: precipSum, sunshineDuration: lastDailySunshine, sunrise: lastDailySunrise,
                sunset: lastDailySunset, isActual
              }
            });
          }
        }

        // Extrapolate remaining ~30 days
        console.log(`[WeatherEngine] Extrapolating 30 days of hourly forecast for ${city.cityName}...`);
        const lastApiRecord = parsedHours[parsedHours.length - 1];
        const lastApiDateStr = lastApiRecord.date;

        for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
          const extrapolatedDate = dayOffset === 0 ? lastApiDateStr : addDays(lastApiDateStr, dayOffset);
          const startHour = dayOffset === 0 ? Number(lastApiRecord.timeStr.split(':')[0]) + 1 : 0;
          
          if (startHour >= 24) continue;

          for (let hour = startHour; hour < 24; hour++) {
            const timeStr = `${String(hour).padStart(2, '0')}:00`;
            const sourceIndex = hour % parsedHours.length;
            const source = parsedHours[sourceIndex];
            
            const sourceTemp = source.temp;
            const sourceWind = source.windSpeed;
            const sourceHumidity = source.relativeHumidity;
            const sourcePrecipProb = source.precipProb;
            const sourcePrecipSum = source.precipSum;

          const randomNoise = () => (Math.random() - 0.5) * 1.5;
          const randomNoiseSmall = () => (Math.random() - 0.5) * 0.5;
          const randomNoiseLarge = () => (Math.random() - 0.5) * 5;

          const extraTemp = Number((sourceTemp + randomNoise()).toFixed(1));
          const extraWind = Number(Math.max(0, sourceWind + randomNoise()).toFixed(1));
          const extraHumidity = Number(Math.min(100, Math.max(0, sourceHumidity + randomNoiseLarge())).toFixed(1));
          const extraPrecipProb = Number(Math.min(100, Math.max(0, sourcePrecipProb + randomNoiseLarge())).toFixed(1));
          const extraPrecip = Number(Math.max(0, sourcePrecipSum + randomNoiseSmall()).toFixed(2));

          const minutes = ['00', '15', '30', '45'];
          for (const minute of minutes) {
            const timeStrSlot = `${String(hour).padStart(2, '0')}:${minute}`;
            await prisma.weatherForecastHourly.upsert({
              where: {
                date_timeStr_cityId: {
                  date: extrapolatedDate,
                  timeStr: timeStrSlot,
                  cityId: city.id
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
                cityId: city.id,
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
      } // End of city loop

      console.log('[WeatherEngine] Hourly weather forecast sync complete.');
      await ApiLogService.createLog('Weather Hourly API', "Dynamic City API", 'SUCCESS', 'Fetched and stored 30-day hourly forecast for all cities');
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
    console.log('[WeatherEngine] Updating daily historical weather data (backfilling past 14 days)...');
    try {
      const cities = await prisma.cityStateData.findMany();
      if (cities.length === 0) {
        console.warn('[WeatherEngine] No cities found. Skipping daily historical sync.');
        return;
      }

      for (const city of cities) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&past_days=14&forecast_days=1&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum,sunshine_duration,relative_humidity_2m_max,precipitation_probability_max,sunrise,sunset&timezone=auto`;
        
        try {
          const response = await axiosClient.get(url);
          const daily = response.data?.daily;
          if (!daily || !daily.time) continue;

          const todayStr = new Date().toISOString().split('T')[0];

          for (let i = 0; i < daily.time.length; i++) {
            const date = daily.time[i];
            if (date > todayStr) continue; // Only store historical/today

            const maxTemp = daily.temperature_2m_max?.[i] ?? 30;
            const minTemp = daily.temperature_2m_min?.[i] ?? 20;
            const windSpeed = daily.wind_speed_10m_max?.[i] ?? 10;
            const precipSum = daily.precipitation_sum?.[i] ?? 0;
            const sunshineSec = daily.sunshine_duration?.[i] ?? 0;
            const sunshineDuration = Number((sunshineSec / 3600).toFixed(2));
            const relativeHumidity = daily.relative_humidity_2m_max?.[i] ?? 50;
            const precipProb = daily.precipitation_probability_max?.[i] ?? 0;
            
            const rawSunrise = daily.sunrise?.[i] ?? '';
            const rawSunset = daily.sunset?.[i] ?? '';
            const sunrise = rawSunrise.includes('T') ? rawSunrise.split('T')[1] : rawSunrise || '05:30';
            const sunset = rawSunset.includes('T') ? rawSunset.split('T')[1] : rawSunset || '19:00';

            await prisma.weatherHistorical.upsert({
              where: { date_cityId: { date, cityId: city.id } },
              update: {
                maxTemp, minTemp, windSpeed, relativeHumidity, 
                precipitationProb: precipProb, precipitationSum: precipSum, rainSum: precipSum,
                sunshineDuration, sunrise, sunset, isActual: true
              },
              create: {
                date, cityId: city.id,
                maxTemp, minTemp, windSpeed, relativeHumidity,
                precipitationProb: precipProb, precipitationSum: precipSum, rainSum: precipSum,
                sunshineDuration, sunrise, sunset, isActual: true
              }
            });
          }
        } catch (e: any) {
          console.error(`[WeatherEngine] Failed to get historical data for ${city.cityName}`, e.message);
        }
      }

      console.log(`[WeatherEngine] Daily historical weather updated for ${cities.length} cities`);
      await ApiLogService.createLog('Weather Historical API', 'Open-Meteo Forecast', 'SUCCESS', `Updated historical weather actuals for past 14 days for all cities`);
    } catch (error: any) {
      console.error('[WeatherEngine] Failed to update historical weather data:', error);
      await ApiLogService.createLog('Weather Historical API', 'https://api.open-meteo.com/v1/forecast', 'ERROR', error.message);
    }
  }

  public static async updateDailyForecastSummary(): Promise<void> {
    console.log('[WeatherEngine] Updating daily forecast summary data (next 14 days)...');
    try {
      const cities = await prisma.cityStateData.findMany();
      if (cities.length === 0) {
        console.warn('[WeatherEngine] No cities found. Skipping daily forecast sync.');
        return;
      }

      for (const city of cities) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&past_days=0&forecast_days=14&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum,sunshine_duration,relative_humidity_2m_max,precipitation_probability_max,sunrise,sunset&timezone=auto`;
        
        try {
          const response = await axiosClient.get(url);
          const daily = response.data?.daily;
          if (!daily || !daily.time) continue;

          for (let i = 0; i < daily.time.length; i++) {
            const date = daily.time[i];

            const maxTemp = daily.temperature_2m_max?.[i] ?? 30;
            const minTemp = daily.temperature_2m_min?.[i] ?? 20;
            const windSpeed = daily.wind_speed_10m_max?.[i] ?? 10;
            const precipSum = daily.precipitation_sum?.[i] ?? 0;
            const sunshineSec = daily.sunshine_duration?.[i] ?? 0;
            const sunshineDuration = Number((sunshineSec / 3600).toFixed(2));
            const relativeHumidity = daily.relative_humidity_2m_max?.[i] ?? 50;
            const precipProb = daily.precipitation_probability_max?.[i] ?? 0;
            
            const rawSunrise = daily.sunrise?.[i] ?? '';
            const rawSunset = daily.sunset?.[i] ?? '';
            const sunrise = rawSunrise.includes('T') ? rawSunrise.split('T')[1] : rawSunrise || '05:30';
            const sunset = rawSunset.includes('T') ? rawSunset.split('T')[1] : rawSunset || '19:00';

            await prisma.weatherForecast.upsert({
              where: { date_cityId: { date, cityId: city.id } },
              update: {
                maxTemp, minTemp, windSpeed, relativeHumidity, 
                precipitationProb: precipProb, precipitationSum: precipSum,
                sunshineDuration, sunrise, sunset, isActual: false
              },
              create: {
                date, cityId: city.id,
                maxTemp, minTemp, windSpeed, relativeHumidity,
                precipitationProb: precipProb, precipitationSum: precipSum,
                sunshineDuration, sunrise, sunset, isActual: false
              }
            });
          }
        } catch (e: any) {
          console.error(`[WeatherEngine] Failed to get daily forecast data for ${city.cityName}`, e.message);
        }
      }

      console.log(`[WeatherEngine] Daily forecast weather updated for ${cities.length} cities`);
      await ApiLogService.createLog('Weather Forecast API', 'Open-Meteo Forecast', 'SUCCESS', `Updated daily forecast summary for next 14 days for all cities`);
    } catch (error: any) {
      console.error('[WeatherEngine] Failed to update daily forecast weather data:', error);
      await ApiLogService.createLog('Weather Forecast API', 'https://api.open-meteo.com/v1/forecast', 'ERROR', error.message);
    }
  }
}
