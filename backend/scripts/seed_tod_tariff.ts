import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

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

  // 3. Read Excel TOD sheet
  const filePath = path.join(__dirname, '../../TOD sheet with charges.xlsx');
  console.log('Reading spreadsheet from:', filePath);
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

  console.log(`Loaded ${jsonData.length} rows from Excel.`);

  let insertedCount = 0;

  for (const row of jsonData) {
    // Validate required fields
    if (!row['State'] || !row['Month Start'] || !row['Month End']) {
      continue;
    }

    const stateName = String(row['State']).trim();
    const stateCode = stateName === 'Uttar Pradesh' ? 'UP' : 'UNKNOWN';

    // Parse date ranges to list of months
    const monthStartSerial = Number(row['Month Start']);
    const monthEndSerial = Number(row['Month End']);
    const startDate = excelDateToJSDate(monthStartSerial);
    const endDate = excelDateToJSDate(monthEndSerial);
    const months = getMonthsInRange(startDate, endDate);

    // Map other fields
    const category = String(row['Consumer Category'] || '').trim();
    const subCategory = String(row['DISCOM'] || '').trim();
    const season = String(row['Season'] || '').trim();

    // Map TOD fields
    const todName = String(row['TOD Name'] || '').trim();
    const tod = String(row['__EMPTY'] || 'normal').trim(); // 17th column is empty in header, holds TOD label
    
    const todStartHour = String(row['TOD Slab Start'] !== undefined ? row['TOD Slab Start'] : '').padStart(2, '0');
    const todEndHour = String(row['TOD Slab End'] !== undefined ? row['TOD Slab End'] : '').padStart(2, '0');

    const baseEnergyCharges = row['Base Energy Rate'] !== undefined ? Number(row['Base Energy Rate']) : null;
    const todRate = row['TOD Rate'] !== undefined ? Number(row['TOD Rate']) : null;
    const energyCharges = row['Energy Rate'] !== undefined ? Number(row['Energy Rate']) : null;

    // Generate voltage level formats to support flexible matches: e.g. "33", "33kV", "33 kV"
    const rawVoltage = String(row['Voltage Level'] || '').trim();
    const digitsMatch = rawVoltage.match(/^(\d+)/);
    const digits = digitsMatch ? digitsMatch[1] : rawVoltage;

    if (!digits) continue;

    const voltageFormats = Array.from(new Set([
      digits,
      `${digits}kV`,
      `${digits} kV`
    ]));

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
              state,
              baseEnergyCharges,
              todRate,
              energyCharges,
              todStartHour,
              todEndHour
            },
            create: {
              stateCode,
              month,
              state,
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

  console.log(`Successfully completed seeding state_tariff. Total records upserted: ${insertedCount}`);
}

const state = 'Uttar Pradesh';

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
