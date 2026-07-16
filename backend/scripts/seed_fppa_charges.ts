import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const filePath = path.join(__dirname, '../../backend_tables_updated - fppa_charges.csv');
  
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
      await prisma.fppaCharges.upsert({
        where: {
          state_month: {
            state: record.state.trim().toUpperCase(),
            month: parseInt(record.month, 10)
          }
        },
        update: {
          fppaChargePercent: record.fppa_charge_percent ? parseFloat(record.fppa_charge_percent) : null
        },
        create: {
          state: record.state.trim().toUpperCase(),
          month: parseInt(record.month, 10),
          fppaChargePercent: record.fppa_charge_percent ? parseFloat(record.fppa_charge_percent) : null
        }
      });
      success++;
    } catch (error) {
      console.error(`Error processing state: ${record.state}, month: ${record.month}:`, error);
    }
  }

  console.log(`Successfully seeded ${success} records into FppaCharges.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
