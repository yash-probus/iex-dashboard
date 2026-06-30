import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateTimeseriesData = (date: string) => {
  const data = [];
  const baseDemand = 230000;
  
  for (let i = 0; i < 96; i++) {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Continuous time variable from 0 to 24
    const t = i / 4.0;
    
    // Simulate demand curve (smooth sine wave + noise)
    // Base demand: 220000, Peak around 20:00 (8 PM)
    const demandBase = 225000 - 10000 * Math.cos((t - 4) * Math.PI / 12) + 5000 * Math.sin((t - 14) * Math.PI / 12);
    const demandNoise = (Math.random() - 0.5) * 1500;
    const demandMet = Math.round(demandBase + demandNoise);
    
    // Simulate generation sources
    const hydro = 20000 + 2000 * Math.sin(t * Math.PI / 12) + (Math.random() - 0.5) * 500;
    const wind = 15000 + 1000 * Math.cos(t * Math.PI / 12) + (Math.random() - 0.5) * 400;
    const gas = 5000 + (Math.random() - 0.5) * 200;
    const nuclear = 7000 + (Math.random() - 0.5) * 50; // Constant base load with tiny noise
    
    // Solar peaks smoothly at 12:30
    let solar = 0;
    if (t > 6 && t < 18.5) {
       // Parabolic curve for solar
       const peakT = 12.5;
       const width = 6.25; // 6.25 hours from peak to 0
       const normalizedT = (t - peakT) / width;
       solar = Math.max(0, 42000 * (1 - normalizedT * normalizedT)) + (Math.random() - 0.5) * 800;
    }
    
    const thermal = demandMet - (hydro + wind + gas + solar + nuclear);

    data.push({
      date,
      timeStr,
      demandMet,
      hydro: Math.round(hydro),
      wind: Math.round(wind),
      gas: Math.round(gas),
      solar: Math.round(solar),
      nuclear: Math.round(nuclear),
      thermal: Math.round(thermal),
    });
  }
  return data;
};

async function main() {
  const dateStr = '2026-06-30'; // Static date for now, could accept args
  
  console.log(`Seeding NPP data for ${dateStr}...`);
  
  const data = generateTimeseriesData(dateStr);
  
  for (const record of data) {
    await prisma.nppDemandData.upsert({
      where: {
        date_timeStr: {
          date: record.date,
          timeStr: record.timeStr
        }
      },
      update: record,
      create: record,
    });
  }
  
  console.log(`Successfully seeded ${data.length} records for ${dateStr}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
