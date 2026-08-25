import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const statesTemplate = [
  { region: 'Northern States', name: 'Jammu & Kashmir', base: 2500, price: 4.40 },
  { region: 'Northern States', name: 'Himachal Pradesh', base: 1800, price: 4.40 },
  { region: 'Northern States', name: 'Punjab', base: 12000, price: 4.40 },
  { region: 'Northern States', name: 'Haryana', base: 9500, price: 4.40 },
  { region: 'Northern States', name: 'Uttarakhand', base: 2100, price: 4.40 },
  { region: 'Northern States', name: 'Delhi', base: 6500, price: 4.40 },
  { region: 'Northern States', name: 'Uttar Pradesh', base: 22000, price: 4.40 },
  { region: 'Northern States', name: 'Rajasthan', base: 14000, price: 4.40 },
  { region: 'Northern States', name: 'Chandigarh', base: 400, price: 4.40 },
  
  { region: 'Western States', name: 'Gujarat', base: 22500, price: 5.10 },
  { region: 'Western States', name: 'Madhya Pradesh', base: 15000, price: 5.10 },
  { region: 'Western States', name: 'Maharashtra', base: 28000, price: 5.10 },
  { region: 'Western States', name: 'Goa', base: 600, price: 5.10 },
  { region: 'Western States', name: 'Daman & Diu', base: 350, price: 5.10 },
  { region: 'Western States', name: 'Dadra & Nagar Haveli', base: 850, price: 5.10 },

  { region: 'Southern States', name: 'Andhra Pradesh', base: 11000, price: 3.83 },
  { region: 'Southern States', name: 'Telangana', base: 14000, price: 3.83 },
  { region: 'Southern States', name: 'Karnataka', base: 14500, price: 3.83 },
  { region: 'Southern States', name: 'Kerala', base: 4000, price: 3.83 },
  { region: 'Southern States', name: 'Tamil Nadu', base: 16500, price: 3.83 },
  { region: 'Southern States', name: 'Puducherry', base: 450, price: 3.83 },

  { region: 'Eastern States', name: 'Bihar', base: 6300, price: 4.17 },
  { region: 'Eastern States', name: 'Jharkhand', base: 2800, price: 4.17 },
  { region: 'Eastern States', name: 'West Bengal', base: 9500, price: 4.17 },
  { region: 'Eastern States', name: 'Odisha', base: 5600, price: 4.17 },
  { region: 'Eastern States', name: 'Chhattisgarh', base: 4800, price: 4.17 },

  { region: 'North-Eastern States', name: 'Sikkim', base: 120, price: 3.14 },
  { region: 'North-Eastern States', name: 'Assam', base: 2100, price: 3.14 },
  { region: 'North-Eastern States', name: 'Arunachal Pradesh', base: 150, price: 3.14 },
  { region: 'North-Eastern States', name: 'Meghalaya', base: 380, price: 3.14 },
  { region: 'North-Eastern States', name: 'Nagaland', base: 140, price: 3.14 },
  { region: 'North-Eastern States', name: 'Manipur', base: 220, price: 3.14 },
  { region: 'North-Eastern States', name: 'Mizoram', base: 110, price: 3.14 },
  { region: 'North-Eastern States', name: 'Tripura', base: 310, price: 3.14 }
];

async function seedHistoricalStateDemand() {
  console.log('[StateSeed] Starting 3-month state data backfill (~300k rows)...');
  
  const startDate = '2026-04-01';
  const endDate = '2026-06-30';
  
  let currentDate = startDate;
  const batchSize = 10000;
  let batch = [];
  let inserted = 0;

  while (currentDate <= endDate) {
    const month = parseInt(currentDate.split('-')[1]);
    
    // Seasonal modifier
    let seasonalMult = 1.0;
    if (month >= 4 && month <= 9) seasonalMult = 1.15; // Summer
    if (month >= 11 || month <= 2) seasonalMult = 0.90; // Winter

    for (let h = 0; h < 24; h++) {
      // Daily curve modifier
      let timeMult = 1.0;
      if (h >= 19 && h <= 22) timeMult = 1.15; // Evening peak
      if (h >= 2 && h <= 5) timeMult = 0.85;   // Night trough
        
      for (let m = 0; m < 60; m += 15) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        for (const state of statesTemplate) {
          // add random noise -5% to +5%
          const noise = 1 + ((Math.random() - 0.5) * 0.1);
          const demand = Math.round(state.base * seasonalMult * timeMult * noise);
          
          batch.push({
            stateName: state.name,
            date: currentDate,
            timeStr: timeStr,
            demand: demand,
            unit: 'MW',
            region: state.region,
            price: state.price
          });
        }

        if (batch.length >= batchSize) {
          await prisma.stateDemandData.createMany({
            data: batch,
            skipDuplicates: true
          });
          inserted += batch.length;
          console.log(`[StateSeed] Inserted ${inserted} rows...`);
          batch = [];
        }
      }
    }
    
    currentDate = addDays(currentDate, 1);
  }

  if (batch.length > 0) {
    await prisma.stateDemandData.createMany({
      data: batch,
      skipDuplicates: true
    });
    inserted += batch.length;
  }

  console.log(`[StateSeed] Finished! Inserted ${inserted} historical 15-min state records.`);
}

seedHistoricalStateDemand()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
