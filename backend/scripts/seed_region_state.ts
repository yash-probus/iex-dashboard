import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

async function run() {
  const filePath = '../backend_tables_saving_calculator_ver1 - region_state.csv';
  
  const records: any[] = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => records.push(data))
      .on('end', () => resolve(true))
      .on('error', (err) => reject(err));
  });

  console.log(`Loaded ${records.length} records from CSV.`);
  
  let success = 0;
  for (const record of records) {
    if (!record.state_name) continue;
    
    // Determine enum value for state_ut
    let stateOrUtValue: 'state' | 'ut' | undefined = undefined;
    if (record.state_ut === 'State') stateOrUtValue = 'state';
    else if (record.state_ut === 'UT') stateOrUtValue = 'ut';

    try {
      if (record.state_code) {
        await prisma.regionState.upsert({
          where: { stateCode: record.state_code },
          update: {
            regionalGrid: record.regional_grid || null,
            regionCode: record.region_code || null,
            regionName: record.region_name || null,
            stateName: record.state_name,
            stateOrUt: stateOrUtValue
          },
          create: {
            regionalGrid: record.regional_grid || null,
            regionCode: record.region_code || null,
            regionName: record.region_name || null,
            stateName: record.state_name,
            stateCode: record.state_code,
            stateOrUt: stateOrUtValue
          }
        });
        success++;
      } else {
        console.warn(`Missing state_code for ${record.state_name}, skipping...`);
      }
    } catch (error) {
      console.error(`Error processing ${record.state_name}:`, error);
    }
  }

  console.log(`Successfully seeded ${success} records into RegionState.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
