/**
 * seed2YearsWeather.ts
 *
 * Fetches 2 years of real historical weather data for New Delhi
 * from Open-Meteo Archive API (free, no API key required) and seeds
 * it into the WeatherForecast table.
 *
 * API used:
 *   https://archive-api.open-meteo.com/v1/archive
 *   - latitude=28.61 (New Delhi)
 *   - longitude=77.20
 *   - daily fields: temperature_2m_max, temperature_2m_min, windspeed_10m_max,
 *                   precipitation_sum, precipitation_probability_max,
 *                   sunshine_duration, relative_humidity_2m_max, sunrise, sunset
 *
 * The archive API supports up to the current date minus a few days.
 * Remaining future days are filled with null / isActual=false.
 *
 * Usage:
 *   npx ts-node scripts/seed2YearsWeather.ts
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const START_DATE = '2024-07-01';
const END_DATE   = '2026-06-30';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const axiosClient = axios.create({
  timeout: 30000,
  headers: { 'User-Agent': 'IEXDashboard/1.0' },
});

// Open-Meteo archive only goes up to ~2 days ago
function getArchiveEnd(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 3);
  return d.toISOString().split('T')[0];
}

// ─────────────────────────────────────────
// Fetch from Open-Meteo archive in chunks
// (max ~1 year per request recommended)
// ─────────────────────────────────────────
interface DailyWeather {
  date: string;
  maxTemp: number;
  minTemp: number;
  windSpeed: number;
  relativeHumidity: number;
  precipitationProb: number;
  precipitationSum: number;
  sunshineDuration: number; // hours
  sunrise: string;
  sunset: string;
  isActual: boolean;
}

async function fetchArchiveChunk(start: string, end: string): Promise<DailyWeather[]> {
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

  if (!daily?.time) return [];

  const todayStr = new Date().toISOString().split('T')[0];

  return daily.time.map((date: string, i: number) => {
    const rawSunrise: string = daily.sunrise?.[i] ?? '';
    const rawSunset:  string = daily.sunset?.[i]  ?? '';

    // Open-Meteo returns "2024-07-01T05:27" — strip date prefix
    const sunrise = rawSunrise.includes('T') ? rawSunrise.split('T')[1] : rawSunrise || '05:30';
    const sunset  = rawSunset.includes('T')  ? rawSunset.split('T')[1]  : rawSunset  || '19:00';

    // sunshine_duration is in seconds → convert to hours
    const sunshineSec: number = daily.sunshine_duration?.[i] ?? 0;

    return {
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
      isActual: date <= todayStr,
    };
  });
}

// ─────────────────────────────────────────
// Split date range into ~11-month chunks
// ─────────────────────────────────────────
function splitIntoChunks(start: string, end: string, chunkDays = 330): Array<[string, string]> {
  const chunks: Array<[string, string]> = [];
  let current = start;
  while (current <= end) {
    const d = new Date(current + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + chunkDays - 1);
    const chunkEnd = d.toISOString().split('T')[0];
    chunks.push([current, chunkEnd > end ? end : chunkEnd]);
    d.setUTCDate(d.getUTCDate() + 1);
    current = d.toISOString().split('T')[0];
    if (current > end) break;
  }
  return chunks;
}

// ─────────────────────────────────────────
// Main
// ─────────────────────────────────────────
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(` Weather 2-Year Historical Seeder`);
  console.log(` Range: ${START_DATE} → ${END_DATE}`);
  console.log(` Source: Open-Meteo Archive API (New Delhi)`);
  console.log(`${'='.repeat(60)}\n`);

  const archiveEnd = getArchiveEnd();
  const effectiveEnd = END_DATE < archiveEnd ? END_DATE : archiveEnd;

  console.log(`[INFO] Archive data available up to: ${archiveEnd}`);
  console.log(`[INFO] Will fetch actuals up to:     ${effectiveEnd}`);
  console.log(`[INFO] Remaining dates will be skipped (no historical data yet)\n`);

  // Pre-check existing
  const existing = await prisma.weatherForecast.findMany({
    where: { date: { gte: START_DATE, lte: END_DATE } },
    select: { date: true },
  });
  const existingDates = new Set(existing.map(r => r.date));
  console.log(`[PRE-CHECK] Already have weather data for ${existingDates.size} dates.\n`);

  // Fetch in chunks
  const chunks = splitIntoChunks(START_DATE, effectiveEnd);
  console.log(`[INFO] Fetching in ${chunks.length} chunks from Open-Meteo archive...\n`);

  const allRecords: DailyWeather[] = [];

  for (let c = 0; c < chunks.length; c++) {
    const [start, end] = chunks[c];
    console.log(`[CHUNK ${c + 1}/${chunks.length}] Fetching ${start} → ${end}...`);

    try {
      const records = await fetchArchiveChunk(start, end);
      const newRecords = records.filter(r => !existingDates.has(r.date));
      allRecords.push(...newRecords);
      console.log(`  Got ${records.length} days, ${newRecords.length} are new.`);
    } catch (err: any) {
      console.error(`  [ERROR] Chunk failed: ${err.message}`);
    }

    if (c < chunks.length - 1) await sleep(1000);
  }

  if (allRecords.length === 0) {
    console.log('\n[INFO] No new records to insert. All dates already seeded.');
    return;
  }

  console.log(`\n[INSERT] Upserting ${allRecords.length} weather records...`);

  let upserted = 0;
  const BATCH = 200;

  for (let i = 0; i < allRecords.length; i += BATCH) {
    const batch = allRecords.slice(i, i + BATCH);
    for (const r of batch) {
      await prisma.weatherForecast.upsert({
        where: { date: r.date },
        update: {
          maxTemp:           r.maxTemp,
          minTemp:           r.minTemp,
          windSpeed:         r.windSpeed,
          relativeHumidity:  r.relativeHumidity,
          precipitationProb: r.precipitationProb,
          precipitationSum:  r.precipitationSum,
          sunshineDuration:  r.sunshineDuration,
          sunrise:           r.sunrise,
          sunset:            r.sunset,
          isActual:          r.isActual,
        },
        create: {
          date:              r.date,
          maxTemp:           r.maxTemp,
          minTemp:           r.minTemp,
          windSpeed:         r.windSpeed,
          relativeHumidity:  r.relativeHumidity,
          precipitationProb: r.precipitationProb,
          precipitationSum:  r.precipitationSum,
          sunshineDuration:  r.sunshineDuration,
          sunrise:           r.sunrise,
          sunset:            r.sunset,
          isActual:          r.isActual,
        },
      });
      upserted++;
    }
    console.log(`  Upserted ${upserted}/${allRecords.length}...`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(` Weather Seeding Complete!`);
  console.log(`  Records upserted: ${upserted}`);
  console.log(`  Date range:       ${START_DATE} → ${effectiveEnd}`);
  console.log(`${'='.repeat(60)}\n`);
}

main()
  .catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
