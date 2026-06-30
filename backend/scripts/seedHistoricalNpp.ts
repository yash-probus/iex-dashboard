import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

async function seedHistoricalNpp() {
  console.log('[NppSeed] Starting 2-year historical data backfill...');
  
  const startDate = '2024-04-01';
  const endDate = '2026-06-30';
  
  let currentDate = startDate;
  const batchSize = 10000;
  let batch = [];
  let inserted = 0;

  while (currentDate <= endDate) {
    const month = parseInt(currentDate.split('-')[1]);
    
    // Adjust base demand based on seasons
    let baseDemand = 220000; // Winter base
    if (month >= 4 && month <= 9) {
      baseDemand = 260000; // Summer base
    }

    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        // Add daily curve variation (peak around 8PM, low at 4AM)
        let timeMultiplier = 1.0;
        if (h >= 19 && h <= 22) timeMultiplier = 1.15; // Evening peak
        if (h >= 2 && h <= 5) timeMultiplier = 0.85;   // Night trough
        
        // Solar generation (only during day)
        let solar = 0;
        if (h >= 7 && h <= 17) {
          // Peak solar around 12-1PM
          solar = 50000 - (Math.abs(12 - h) * 8000) + (Math.random() * 2000);
        }

        const demand = Math.round(baseDemand * timeMultiplier + (Math.random() * 10000 - 5000));
        
        const shortage = Math.round(Math.random() * 1500);

        batch.push({
          date: currentDate,
          timeStr: timeStr,
          demandMet: demand - shortage,
          hydro: Math.round(30000 + Math.random() * 5000),
          wind: Math.round(15000 + Math.random() * 5000),
          gas: Math.round(4000 + Math.random() * 1000),
          solar: Math.max(0, Math.round(solar)),
          nuclear: Math.round(7000 + Math.random() * 500),
          thermal: Math.round(demand * 0.65)
        });

        if (batch.length >= batchSize) {
          await prisma.nppDemandData.createMany({
            data: batch,
            skipDuplicates: true
          });
          inserted += batch.length;
          console.log(`[NppSeed] Inserted ${inserted} rows...`);
          batch = [];
        }
      }
    }
    
    currentDate = addDays(currentDate, 1);
  }

  if (batch.length > 0) {
    await prisma.nppDemandData.createMany({
      data: batch,
      skipDuplicates: true
    });
    inserted += batch.length;
  }

  console.log(`[NppSeed] Finished! Inserted ${inserted} historical 15-min records.`);
}

seedHistoricalNpp()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
