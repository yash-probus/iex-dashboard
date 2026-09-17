import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default coordinates for New Delhi
const LAT = 28.6139;
const LON = 77.2090;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchYearData(year: number) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  console.log(`Fetching data for ${year}...`);
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}&start_date=${startDate}&end_date=${endDate}&minutely_15=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation,precipitation,cloud_cover&timezone=Asia/Kolkata`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data for ${year}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

async function main() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
  
  for (const year of years) {
    try {
      const data = await fetchYearData(year);
      
      if (!data || !data.minutely_15 || !data.minutely_15.time) {
        console.warn(`No 15-minute data found for ${year}`);
        continue;
      }
      
      const { time, temperature_2m, relative_humidity_2m, wind_speed_10m, shortwave_radiation, precipitation, cloud_cover } = data.minutely_15;
      
      const records = [];
      for (let i = 0; i < time.length; i++) {
        // time is in ISO format like "2024-01-01T00:00"
        const timestamp = new Date(time[i]);
        
        // Calculate interval number (1 to 96)
        const hours = timestamp.getHours();
        const minutes = timestamp.getMinutes();
        const intervalNumber = (hours * 4) + (minutes / 15) + 1;
        
        records.push({
          timestamp,
          intervalNumber,
          temperature: temperature_2m[i],
          humidity: relative_humidity_2m[i],
          windSpeed: wind_speed_10m[i],
          solarRadiation: shortwave_radiation[i],
          precipitation: precipitation[i],
          cloudCover: cloud_cover[i],
        });
      }
      
      // Batch insert in chunks of 5000 to avoid query size limits
      const chunkSize = 5000;
      console.log(`Saving ${records.length} records for ${year}...`);
      
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        await prisma.historicalWeather.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        process.stdout.write('.');
      }
      console.log(`\nSuccessfully saved data for ${year}`);
      
      // Sleep to avoid rate limits
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
