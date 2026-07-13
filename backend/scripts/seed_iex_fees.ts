import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

async function run() {
  const filePath = '../backend_tables_saving_calculator_ver1 - iex_fees (1).csv';
  
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
    if (!record.month) continue;

    const parseNum = (val: string) => {
      if (!val || val.trim() === '') return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    try {
      const monthInt = parseInt(record.month, 10);
      
      await prisma.iexFees.upsert({
        where: { month: monthInt },
        update: {
          exchangeFees: parseNum(record.exchange_fees),
          exchangeFeesGst: parseNum(record.exchange_fees_gst_percent),
          nldcApplicationFees: parseNum(record.nldc_application_fees),
          nldcSchedulingFees: parseNum(record.nldc_scheduling_fees),
          sldcSchedulingFees: parseNum(record.sldc_scheduling_fees),
          otherFixCharges: parseNum(record.other_fix_charges),
        },
        create: {
          month: monthInt,
          exchangeFees: parseNum(record.exchange_fees),
          exchangeFeesGst: parseNum(record.exchange_fees_gst_percent),
          nldcApplicationFees: parseNum(record.nldc_application_fees),
          nldcSchedulingFees: parseNum(record.nldc_scheduling_fees),
          sldcSchedulingFees: parseNum(record.sldc_scheduling_fees),
          otherFixCharges: parseNum(record.other_fix_charges),
        }
      });
      success++;
    } catch (error) {
      console.error(`Error processing month ${record.month}:`, error);
    }
  }

  console.log(`Successfully seeded ${success} records into IexFees.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
