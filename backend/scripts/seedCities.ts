import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function seedCities() {
  console.log('[CitySeed] Starting city seeding from Open-Meteo Geocoding...');
  
  const citiesPath = path.join(__dirname, 'indian_states.json');
  const citiesToSeed = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
  let inserted = 0;

  for (const city of citiesToSeed) {
    const exists = await prisma.cityStateData.findFirst({
      where: {
        cityName: city.cityName,
        stateName: city.stateName
      }
    });

    if (!exists) {
      console.log(`[CitySeed] Geocoding ${city.cityName}...`);
      try {
        const res = await axios.get(`https://geocoding-api.open-meteo.com/v1/search`, {
          params: {
            name: city.cityName,
            count: 1,
            language: 'en',
            format: 'json'
          }
        });

        if (res.data.results && res.data.results.length > 0) {
          const result = res.data.results[0];
          await prisma.cityStateData.create({
            data: {
              cityName: city.cityName,
              stateName: city.stateName,
              latitude: result.latitude,
              longitude: result.longitude,
              population: result.population || 1000000 // fallback if population is not available
            }
          });
          inserted++;
          console.log(`[CitySeed] Added ${city.cityName}, ${city.stateName} (Lat: ${result.latitude}, Lon: ${result.longitude})`);
        } else {
          console.log(`[CitySeed] Could not find geocoding data for ${city.cityName}`);
        }
      } catch (err: any) {
        console.error(`[CitySeed] Error fetching data for ${city.cityName}:`, err.message);
      }
      
      // Delay to avoid hitting API rate limits
      await new Promise(r => setTimeout(r, 500));
    } else {
      console.log(`[CitySeed] Skipped ${city.cityName}, ${city.stateName} (Already exists)`);
    }
  }

  console.log(`[CitySeed] Finished! Inserted ${inserted} new cities.`);
}

seedCities()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
