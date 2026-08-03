import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const filePath = path.join(__dirname, '../../fppa-charges.csv');
  
  const records: any[] = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => records.push(data))
      .on('end', () => resolve(true))
      .on('error', (err) => reject(err));
  });

  console.log(`Loaded ${records.length} records from CSV.`);
  
  // Delete old data
  console.log('Removing old FPPA data...');
  await prisma.fppaCharges.deleteMany({});
  
  let success = 0;
  for (const record of records) {
    if (!record.State || !record.Month) continue;

    const state = record.State.trim();
    const month = parseInt(record.Month, 10);
    const discom = record.Discom ? record.Discom.trim() : null;
    const charge = record['FPPA Charge %'] ? parseFloat(record['FPPA Charge %']) : null;

    try {
      await prisma.fppaCharges.upsert({
        where: {
          state_discom_month: {
            state: state,
            discom: discom || '',
            month: month
          }
        },
        update: {
          fppaChargePercent: charge
        },
        create: {
          state: state,
          discom: discom || '',
          month: month,
          fppaChargePercent: charge
        }
      });
      success++;
    } catch (error) {
      console.error(`Error processing state: ${state}, discom: ${discom}, month: ${month}:`, error);
    }
  }

  console.log(`Successfully seeded ${success} records into FppaCharges.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
