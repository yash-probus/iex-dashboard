import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

async function run() {
  const filePath = '../backend_tables_saving_calculator_ver1 - ctu_charges (1).csv';
  
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
    if (!record.state || !record.month) continue;

    try {
      await prisma.ctuCharges.upsert({
        where: {
          state_month: {
            state: record.state,
            month: parseInt(record.month, 10)
          }
        },
        update: {
          ctu_charges_rs_per_kwh: record.ctu_charges_rs_per_kwh ? parseFloat(record.ctu_charges_rs_per_kwh) : null
        },
        create: {
          state: record.state,
          month: parseInt(record.month, 10),
          ctu_charges_rs_per_kwh: record.ctu_charges_rs_per_kwh ? parseFloat(record.ctu_charges_rs_per_kwh) : null
        }
      });
      success++;
    } catch (error) {
      console.error(`Error processing state: ${record.state}, month: ${record.month}:`, error);
    }
  }

  console.log(`Successfully seeded ${success} records into CtuCharges.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
