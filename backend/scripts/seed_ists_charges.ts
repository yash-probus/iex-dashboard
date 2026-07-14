import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

async function run() {
  const filePath = '../backend_tables_saving_calculator_ver1 - ists_charges (2).csv';
  
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
    if (!record.start_date || !record.end_date) continue;

    try {
      // Parse dates from YYYY/MM/DD to ISO string
      const startDate = new Date(record.start_date);
      const endDate = new Date(record.end_date);
      const istsLossPercent = parseFloat(record.ists_loss_percent);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(istsLossPercent)) {
        continue;
      }

      await prisma.istsCharges.create({
        data: {
          startDate,
          endDate,
          istsLossPercent,
        }
      });
      success++;
    } catch (error) {
      console.error(`Error processing record:`, error);
    }
  }

  console.log(`Successfully seeded ${success} records into IstsCharges.`);
}

// First wipe the table because this table doesn't have a unique constraint to upsert on
prisma.istsCharges.deleteMany({}).then(() => run().catch(console.error).finally(() => prisma.$disconnect()));
