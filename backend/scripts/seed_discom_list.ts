import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

async function run() {
  const filePath = '../backend_tables_saving_calculator_ver1 - discom_list.csv';
  
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
    if (!record.discom_code || !record.discom_name) continue;

    let discomType = record.discom_type || null;
    // Map longer values to fit the 30-char limit if needed
    if (discomType && discomType.length > 30) {
        discomType = discomType.substring(0, 30);
    }

    try {
      await prisma.discomList.upsert({
        where: { code: record.discom_code },
        update: {
          legalName: record.discom_name,
          stateCode: record.state_code || null,
          discomType: discomType,
        },
        create: {
          code: record.discom_code,
          legalName: record.discom_name,
          stateCode: record.state_code || null,
          discomType: discomType,
        }
      });
      success++;
    } catch (error) {
      console.error(`Error processing ${record.discom_code}:`, error);
    }
  }

  console.log(`Successfully seeded ${success} records into DiscomList.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
