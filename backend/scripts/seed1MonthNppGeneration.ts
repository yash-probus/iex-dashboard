import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import https from 'https';

const prisma = new PrismaClient();

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const axiosClient = axios.create({
  httpsAgent,
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});

async function seedGenerationData() {
  console.log('Starting 1 Month NPP Generation Data Seed...');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  let currentDate = new Date(startDate);
  let totalInserted = 0;

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    console.log(`Fetching NPP Generation data for ${dateStr}...`);

    try {
      const response = await axiosClient.get(`https://npp.gov.in/dashBoard/demandmet2chartdata?date=${dateStr}`);
      const data = response.data;

      if (!data || data.length === 0) {
        console.log(`No data found for ${dateStr}`);
      } else {
        const generationByTime: Record<number, any> = {};

        data.forEach((item: any) => {
          if (!generationByTime[item.updated_on]) {
            generationByTime[item.updated_on] = {
              thermal: null, gas: null, nuclear: null, hydro: null, wind: null, solar: null
            };
          }

          const name = item.name_of_data.toUpperCase();
          const value = Number(item.value_of_data) || 0;

          if (name.includes('THERMAL')) generationByTime[item.updated_on].thermal = value;
          else if (name.includes('GAS')) generationByTime[item.updated_on].gas = value;
          else if (name.includes('NUCLEAR')) generationByTime[item.updated_on].nuclear = value;
          else if (name.includes('HYDRO')) generationByTime[item.updated_on].hydro = value;
          else if (name.includes('WIND')) generationByTime[item.updated_on].wind = value;
          else if (name.includes('SOLAR')) generationByTime[item.updated_on].solar = value;
        });

        const records = [];

        for (const [timestampStr, genData] of Object.entries(generationByTime)) {
          const timestamp = Number(timestampStr);
          const d = new Date(timestamp);
          const formatter = new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          const timeStr = formatter.format(d);

          records.push({
            date: dateStr,
            timeStr,
            thermal: genData.thermal,
            gas: genData.gas,
            nuclear: genData.nuclear,
            hydro: genData.hydro,
            wind: genData.wind,
            solar: genData.solar,
            dataUpdatedAt: d.toISOString(),
            fetchedAt: new Date(),
          });
        }

        if (records.length > 0) {
          const result = await prisma.nppRawGenerationData.createMany({
            data: records,
            skipDuplicates: true
          });
          totalInserted += result.count;
          console.log(`Inserted ${result.count} generation records for ${dateStr}`);
        }
      }
    } catch (error: any) {
      console.error(`Failed to fetch or insert data for ${dateStr}: ${error.message}`);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`\nSeed completed successfully! Total records inserted: ${totalInserted}`);
}

seedGenerationData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
