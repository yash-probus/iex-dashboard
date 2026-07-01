import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching historical weather data for the last 2 years...');
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // yesterday
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=28.6139&longitude=77.2090&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum,sunshine_duration,relative_humidity_2m_max,precipitation_probability_max&timezone=auto`;

  console.log(`URL: ${url}`);

  try {
    const { data } = await axios.get(url);
    const daily = data.daily;
    if (!daily || !daily.time) {
      console.error('Invalid response from Open-Meteo');
      return;
    }

    const records = [];
    for (let i = 0; i < daily.time.length; i++) {
      const sunshineSecs = daily.sunshine_duration[i] || 0;
      records.push({
        date: daily.time[i],
        maxTemp: daily.temperature_2m_max[i] ?? 0,
        minTemp: daily.temperature_2m_min[i] ?? 0,
        windSpeed: daily.wind_speed_10m_max[i] ?? 0,
        relativeHumidity: daily.relative_humidity_2m_max[i] ?? 0,
        precipitationProb: daily.precipitation_probability_max?.[i] ?? 0,
        precipitationSum: daily.precipitation_sum[i] ?? 0,
        sunshineDuration: Number((sunshineSecs / 3600).toFixed(2)),
        isActual: true, // historical data is actual
      });
    }

    console.log(`Upserting ${records.length} records into the database...`);
    
    // Process in smaller batches using Promise.all to speed it up but not overwhelm the DB
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await Promise.all(
        batch.map((record) =>
          prisma.weatherForecast.upsert({
            where: { date: record.date },
            update: {
              maxTemp: record.maxTemp,
              minTemp: record.minTemp,
              windSpeed: record.windSpeed,
              relativeHumidity: record.relativeHumidity,
              precipitationProb: record.precipitationProb,
              precipitationSum: record.precipitationSum,
              sunshineDuration: record.sunshineDuration,
              isActual: record.isActual,
            },
            create: record,
          })
        )
      );
      console.log(`Processed ${Math.min(i + batchSize, records.length)}/${records.length} records...`);
    }

    console.log('Historical weather data seeded successfully!');
  } catch (error: any) {
    console.error('Error fetching/seeding weather data:', error?.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
