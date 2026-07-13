/**
 * seed2YearsWeather.ts
 */
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const START_DATE = '2024-07-01';
const END_DATE   = '2026-07-01';
const DELAY_MS   = 1000;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const axiosClient = axios.create({
  timeout: 30000,
  headers: { 'User-Agent': 'IEXDashboard/1.0' },
});

function getArchiveEnd(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 3);
  return d.toISOString().split('T')[0];
}

interface DailyWeather {
  date: string;
  maxTemp: number;
  minTemp: number;
  windSpeed: number;
  relativeHumidity: number;
  precipitationProb: number;
  precipitationSum: number;
  sunshineDuration: number;
  sunrise: string;
  sunset: string;
  isActual: boolean;
}

async function fetchArchiveChunk(start: string, end: string, city: any): Promise<DailyWeather[]> {
  const url = 'https://archive-api.open-meteo.com/v1/archive';
  const params = {
    latitude: city.latitude,
    longitude: city.longitude,
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

  if (!daily?.time) return [];

  return daily.time.map((date: string, i: number) => {
    const rawSunrise: string = daily.sunrise?.[i] ?? '';
    const rawSunset:  string = daily.sunset?.[i]  ?? '';
    const sunrise = rawSunrise.includes('T') ? rawSunrise.split('T')[1] : rawSunrise || '05:30';
    const sunset  = rawSunset.includes('T')  ? rawSunset.split('T')[1]  : rawSunset  || '19:00';
    const sunshineSec: number = daily.sunshine_duration?.[i] ?? 0;

    return {
      date,
      maxTemp: daily.temperature_2m_max?.[i] ?? 30.0,
      minTemp: daily.temperature_2m_min?.[i] ?? 20.0,
      windSpeed: daily.windspeed_10m_max?.[i] ?? 5.0,
      relativeHumidity: daily.relative_humidity_2m_max?.[i] ?? 50.0,
      precipitationProb: daily.precipitation_probability_max?.[i] ?? 0,
      precipitationSum: daily.precipitation_sum?.[i] ?? 0,
      sunshineDuration: parseFloat((sunshineSec / 3600).toFixed(2)),
      sunrise,
      sunset,
      isActual: true,
    };
  });
}

async function seedWeatherForCity(city: any) {
  console.log(`\n[WeatherSeed] Backfilling weather for ${city.cityName} from ${START_DATE} to ${END_DATE}`);

  const totalDays = Math.ceil((new Date(END_DATE).getTime() - new Date(START_DATE).getTime()) / (1000 * 3600 * 24));
  let currentStart = START_DATE;
  let inserted = 0;

  const actualArchiveEnd = getArchiveEnd();
  const effectiveEnd = (END_DATE > actualArchiveEnd) ? actualArchiveEnd : END_DATE;

  while (currentStart <= effectiveEnd) {
    const startObj = new Date(currentStart);
    startObj.setUTCFullYear(startObj.getUTCFullYear() + 1);
    let chunkEnd = startObj.toISOString().split('T')[0];
    if (chunkEnd > effectiveEnd) chunkEnd = effectiveEnd;

    console.log(`  -> Fetching chunk: ${currentStart} to ${chunkEnd}`);
    try {
      const chunkData = await fetchArchiveChunk(currentStart, chunkEnd, city);
      if (chunkData.length > 0) {
        const recordsToInsert = chunkData.map((d: any) => ({
          ...d,
          cityId: city.id
        }));
        await prisma.weatherForecast.createMany({
          data: recordsToInsert,
          skipDuplicates: true,
        });
        inserted += chunkData.length;
      }
    } catch (e: any) {
      console.error(`  -> Failed: ${e.message}`);
    }

    const nextStart = new Date(chunkEnd);
    nextStart.setUTCDate(nextStart.getUTCDate() + 1);
    currentStart = nextStart.toISOString().split('T')[0];

    await sleep(DELAY_MS);
  }

  if (END_DATE > effectiveEnd) {
    let dummyStart = new Date(effectiveEnd);
    dummyStart.setUTCDate(dummyStart.getUTCDate() + 1);
    let dummyStartStr = dummyStart.toISOString().split('T')[0];

    let dummyRecords: any[] = [];
    while (dummyStartStr <= END_DATE) {
      dummyRecords.push({
        date: dummyStartStr,
        cityId: city.id,
        maxTemp: 35.0,
        minTemp: 25.0,
        windSpeed: 10.0,
        relativeHumidity: 50.0,
        precipitationProb: 0.0,
        precipitationSum: 0.0,
        sunshineDuration: 8.0,
        sunrise: '05:40',
        sunset: '18:50',
        isActual: false,
      });
      const next = new Date(dummyStartStr);
      next.setUTCDate(next.getUTCDate() + 1);
      dummyStartStr = next.toISOString().split('T')[0];
    }
    if (dummyRecords.length > 0) {
      await prisma.weatherForecast.createMany({
        data: dummyRecords,
        skipDuplicates: true,
      });
      inserted += dummyRecords.length;
    }
  }

  console.log(`[WeatherSeed] Finished ${city.cityName}! Inserted ${inserted} rows.`);
}

async function main() {
  const cities = await prisma.cityStateData.findMany();
  if (cities.length === 0) {
    console.error('No cities found in CityStateData. Please run seedCities.ts first.');
    return;
  }
  for (const city of cities) {
    await seedWeatherForCity(city);
  }
}

main()
  .catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
