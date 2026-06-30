import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

async function seedHistoricalWeather() {
  console.log('[WeatherSeed] Starting 2-year historical data backfill...');
  
  const startDate = '2024-04-01';
  const endDate = '2026-06-30';
  
  let currentDate = startDate;
  
  const batchSize = 100;
  let batch = [];
  
  let inserted = 0;

  while (currentDate <= endDate) {
    // Generate realistic weather for New Delhi based on month
    const month = parseInt(currentDate.split('-')[1]);
    
    // Base temperature depends on month (summer: May/June, winter: Dec/Jan)
    let baseMax = 32;
    let baseMin = 20;
    
    if (month >= 4 && month <= 7) { // Summer
      baseMax = 38 + (Math.random() * 7);
      baseMin = 25 + (Math.random() * 5);
    } else if (month >= 11 || month <= 2) { // Winter
      baseMax = 20 + (Math.random() * 5);
      baseMin = 6 + (Math.random() * 5);
    } else { // Spring/Autumn
      baseMax = 30 + (Math.random() * 5);
      baseMin = 18 + (Math.random() * 5);
    }

    batch.push({
      date: currentDate,
      maxTemp: parseFloat(baseMax.toFixed(1)),
      minTemp: parseFloat(baseMin.toFixed(1)),
      windSpeed: parseFloat((5 + Math.random() * 15).toFixed(1)),
      isActual: true
    });

    if (batch.length >= batchSize) {
      await prisma.weatherForecast.createMany({
        data: batch,
        skipDuplicates: true
      });
      inserted += batch.length;
      console.log(`[WeatherSeed] Inserted ${inserted} rows...`);
      batch = [];
    }
    
    currentDate = addDays(currentDate, 1);
  }

  if (batch.length > 0) {
    await prisma.weatherForecast.createMany({
      data: batch,
      skipDuplicates: true
    });
    inserted += batch.length;
  }

  console.log(`[WeatherSeed] Finished! Inserted ${inserted} historical daily records.`);
}

seedHistoricalWeather()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
