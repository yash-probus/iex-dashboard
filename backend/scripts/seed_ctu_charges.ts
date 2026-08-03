import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting CTU Charges seed process...');
  const csvPath = path.join(__dirname, 'ctu_charges.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  // Parse CSV
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} records in CSV. Inserting...`);

  let count = 0;
  for (const record of records) {
    const { state, month, ctu_charges_rs_per_kwh } = record;
    
    // ctu_charges_rs_per_kwh might be negative or positive, Parse as float/decimal
    const parsedCharge = parseFloat(ctu_charges_rs_per_kwh);
    
    if (isNaN(parsedCharge)) {
        console.log(`Skipping invalid charge value: ${ctu_charges_rs_per_kwh} for ${state} ${month}`);
        continue;
    }

    try {
      await prisma.ctuCharges.create({
        data: {
          state: state,
          month: parseInt(month, 10),
          ctu_charges_rs_per_kwh: parsedCharge
        }
      });
      count++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`Record already exists for ${state} ${month}, skipping.`);
      } else {
        console.error(`Error inserting ${state} ${month}:`, error.message);
      }
    }
  }

  console.log(`\nSuccess! Inserted ${count} new records into ctu_charges.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
