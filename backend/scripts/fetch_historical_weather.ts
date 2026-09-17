import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LAT = 28.6139;
const LON = 77.2090;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchYearData(year: number) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  console.log(`Fetching data for ${year}...`);
  // Use hourly data since minutely_15 isn't available for archive
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation,precipitation,cloudcover&timezone=Asia/Kolkata`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data for ${year}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

function interpolate(val1: number, val2: number, steps: number = 4) {
  const diff = val2 - val1;
  const stepSize = diff / steps;
  return [
    val1,
    val1 + stepSize,
    val1 + (stepSize * 2),
    val1 + (stepSize * 3)
  ];
}

async function main() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
  
  for (const year of years) {
    try {
      const data = await fetchYearData(year);
      
      if (!data || !data.hourly || !data.hourly.time) {
        console.warn(`No hourly data found for ${year}`);
        continue;
      }
      
      const { time, temperature_2m, relative_humidity_2m, wind_speed_10m, shortwave_radiation, precipitation, cloudcover } = data.hourly;
      
      const records = [];
      for (let i = 0; i < time.length - 1; i++) {
        const hourTime = new Date(time[i]);
        
        const temp15 = interpolate(temperature_2m[i] || 0, temperature_2m[i+1] || 0);
        const hum15 = interpolate(relative_humidity_2m[i] || 0, relative_humidity_2m[i+1] || 0);
        const wind15 = interpolate(wind_speed_10m[i] || 0, wind_speed_10m[i+1] || 0);
        const rad15 = interpolate(shortwave_radiation[i] || 0, shortwave_radiation[i+1] || 0);
        const prec15 = interpolate(precipitation[i] || 0, precipitation[i+1] || 0);
        const cloud15 = interpolate(cloudcover[i] || 0, cloudcover[i+1] || 0);

        for (let j = 0; j < 4; j++) {
          const timestamp = new Date(hourTime.getTime() + (j * 15 * 60000));
          const hours = timestamp.getHours();
          const minutes = timestamp.getMinutes();
          const intervalNumber = (hours * 4) + (minutes / 15) + 1;
          
          records.push({
            timestamp,
            intervalNumber,
            temperature: temp15[j],
            humidity: hum15[j],
            windSpeed: wind15[j],
            solarRadiation: Math.max(0, rad15[j]),
            precipitation: Math.max(0, prec15[j]),
            cloudCover: Math.max(0, Math.min(100, cloud15[j])),
          });
        }
      }
      
      const chunkSize = 5000;
      console.log(`Saving ${records.length} records for ${year}...`);
      
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        await prisma.$executeRawUnsafe(`
          INSERT INTO "public"."historical_weather" (timestamp, interval_number, temperature, humidity, wind_speed, solar_radiation, precipitation, cloud_cover)
          VALUES ${chunk.map(r => `('${r.timestamp.toISOString()}', ${r.intervalNumber}, ${r.temperature}, ${r.humidity}, ${r.windSpeed}, ${r.solarRadiation}, ${r.precipitation}, ${r.cloudCover})`).join(',')}
          ON CONFLICT (timestamp) DO NOTHING;
        `);
        process.stdout.write('.');
      }
      console.log(`\nSuccessfully saved data for ${year}`);
      
      await sleep(5000);
    } catch (error) {
      console.error(`Error processing ${year}:`, error);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
