import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

function getMonthsInRange(startDate: Date, endDate: Date): number[] {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth(); // 0-indexed
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();

  const months: number[] = [];
  let currentYear = startYear;
  let currentMonth = startMonth;

  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    months.push(currentMonth + 1); // 1-indexed
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }
  return months;
}

async function main() {
  console.log('Seeding RegionState & DiscomList for UP...');

  // 1. Seed Uttar Pradesh in RegionState
  await prisma.regionState.upsert({
    where: { stateCode: 'UP' },
    update: {
      stateName: 'Uttar Pradesh',
      stateOrUt: 'state'
    },
    create: {
      stateName: 'Uttar Pradesh',
      stateCode: 'UP',
      stateOrUt: 'state'
    }
  });

  // 2. Seed UP DISCOMs in DiscomList
  const upDiscoms = [
    { code: 'MVVNL', legalName: 'Madhyanchal Vidyut Vitran Nigam Limited' },
    { code: 'PVVNL', legalName: 'Paschimanchal Vidyut Vitran Nigam Limited' },
    { code: 'DVVNL', legalName: 'Dakshinanchal Vidyut Vitran Nigam Limited' },
    { code: 'PUVVNL', legalName: 'Purvanchal Vidyut Vitran Nigam Limited' },
    { code: 'KESCO', legalName: 'Kanpur Electricity Supply Company' }
  ];

  for (const discom of upDiscoms) {
    await prisma.discomList.upsert({
      where: { code: discom.code },
      update: {
        legalName: discom.legalName,
        stateCode: 'UP',
        discomType: 'Distribution'
      },
      create: {
        code: discom.code,
        legalName: discom.legalName,
        stateCode: 'UP',
        discomType: 'Distribution'
      }
    });
  }

  console.log('Successfully seeded RegionState & DiscomList lookup tables.');

  // 3. Clear existing UP tariffs to prevent duplicate badly-formatted voltage strings
  console.log('Clearing existing UP tariffs before reseeding...');
  await prisma.stateTariff.deleteMany({ where: { stateCode: 'UP' } });

  // 4. Read Excel TOD sheet
  const filePath = path.join(__dirname, 'Untitled spreadsheet - Sheet1.csv');
  console.log('Reading spreadsheet from:', filePath);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}. Skipping Excel TOD data seeding.`);
    return;
  }
  
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

  console.log(`Loaded ${jsonData.length} rows from Excel.`);

  let insertedCount = 0;

  for (const row of jsonData) {
    // Validate required fields
    if (!row['State'] || !row['Start Date'] || !row['End Date']) {
      continue;
    }

    const stateName = String(row['State']).trim();
    const stateCode = stateName === 'Uttar Pradesh' ? 'UP' : 'UNKNOWN';

    // Parse date ranges to list of months
    const monthStartRaw = row['Start Date'];
    const monthEndRaw = row['End Date'];
    
    let startDate: Date;
    if (typeof monthStartRaw === 'string') {
      startDate = new Date(monthStartRaw);
    } else {
      startDate = excelDateToJSDate(monthStartRaw);
    }

    let endDate: Date;
    if (typeof monthEndRaw === 'string') {
      endDate = new Date(monthEndRaw);
    } else {
      endDate = excelDateToJSDate(monthEndRaw);
    }
    
    const months = getMonthsInRange(startDate, endDate);

    // Map other fields
    const category = String(row['Category'] || '').trim();
    const subCategoryRaw = String(row['Sub Category'] || '').trim();
    const season = String(row['Season'] || '').trim();

    // Map TOD fields
    const todName = String(row['TOD Name'] || '').trim();
    const tod = String(row['TOD'] || 'normal').trim(); // CSV has a TOD column now
    
    const todStartHour = String(row['TOD Start Hour'] !== undefined ? row['TOD Start Hour'] : '').padStart(2, '0');
    const todEndHour = String(row['TOD End Hour'] !== undefined ? row['TOD End Hour'] : '').padStart(2, '0');

    const baseEnergyCharges = row['Base Energy Charges'] !== undefined ? Number(row['Base Energy Charges']) : null;
    let todRateStr = String(row['TOD Rate'] || '');
    todRateStr = todRateStr.replace('%', ''); // e.g. '85%' -> '85'
    let todRate = todRateStr ? Number(todRateStr) : null;
    
    // The previous script expected things like 15 or -15, but if the CSV uses 85% or 115%, we should handle it.
    // If the value is > 50, let's normalize it to +/- percentage offsets, or just save the raw value. 
    // The DB stores TOD Rate. We'll store exactly what's parsed since it's just a Decimal.
    
    const energyCharges = row['Energy Charges'] !== undefined ? Number(row['Energy Charges']) : null;

    // Generate voltage level formats to support flexible matches: e.g. "33", "33kV", "33 kV"
    const rawVoltage = String(row['Voltage Level'] || '').trim();
    const digitsMatch = rawVoltage.match(/^(\d+)/);
    const digits = digitsMatch ? digitsMatch[1] : rawVoltage;

    if (!digits) continue;

    const normalizedVoltage = `${digits} kV`;
    const voltageFormats = [normalizedVoltage];

    let subCategoriesToSeed = [subCategoryRaw];
    if (stateCode === 'UP' && subCategoryRaw === 'MVVNL') {
      subCategoriesToSeed = ['MVVNL', 'PVVNL', 'DVVNL', 'PUVVNL', 'KESCO'];
    }

    for (const subCategory of subCategoriesToSeed) {
      for (const month of months) {
        for (const voltageLevel of voltageFormats) {
          try {
            await prisma.stateTariff.upsert({
            where: {
              stateCode_month_category_subCategory_voltageLevel_season_todName_tod: {
                stateCode,
                month,
                category,
                subCategory,
                voltageLevel,
                season,
                todName,
                tod
              }
            },
            update: {
              state: stateName,
              baseEnergyCharges,
              todRate,
              energyCharges,
              todStartHour,
              todEndHour
            },
            create: {
              stateCode,
              month,
              state: stateName,
              category,
              subCategory,
              voltageLevel,
              season,
              todName,
              tod,
              todStartHour,
              todEndHour,
              baseEnergyCharges,
              todRate,
              energyCharges
            }
          });
          insertedCount++;
        } catch (err: any) {
          console.error(`Failed to upsert StateTariff row: ${stateCode}-${month}-${category}-${subCategory}-${voltageLevel}-${season}-${todName}-${tod}:`, err.message);
        }
        }
      }
    }
  }

  console.log(`Successfully completed seeding state_tariff. Total records upserted: ${insertedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
