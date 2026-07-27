import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Parse a CSV line that may contain quoted fields (commas inside quotes).
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function main() {
  const csvPath = path.join(
    __dirname,
    '../',
    'backend_tables_updated - state-tarriff.csv'
  );

  console.log('Reading CSV from:', csvPath);

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const rawContent = fs.readFileSync(csvPath, 'utf-8');
  // Normalise Windows line endings
  const lines = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Parse header
  const header = parseCsvLine(lines[0]);
  console.log('Header columns:', header);

  // Validate expected columns
  const expectedCols = [
    'state',
    'discom',
    'consumer_category',
    'sub-category',
    'supply_voltage_category',
    'supply_voltage',
    'month',
    'tod_start_time',
    'tod_end_time',
    'base_energy_rate',
    'base_energy_unit',
    'tod_charge_percent',
    'energy_rate',
  ];
  for (const col of expectedCols) {
    if (!header.includes(col)) {
      throw new Error(`Expected column "${col}" not found in CSV header. Found: ${header.join(', ')}`);
    }
  }

  // Index map
  const idx = (col: string) => header.indexOf(col);

  // Parse data rows
  const dataRows = lines.slice(1).filter((l) => l.trim().length > 0);
  console.log(`Total data rows: ${dataRows.length}`);

  // Step 1: Delete all existing state_tariff records
  console.log('Deleting all existing state_tariff records...');
  const deleted = await prisma.stateTariff.deleteMany({});
  console.log(`Deleted ${deleted.count} existing records.`);

  // Step 2: Build insert array
  let skippedCount = 0;
  const records: {
    state: string;
    discom: string | null;
    consumerCategory: string;
    subCategory: string;
    supplyVoltageCategory: string;
    supplyVoltage: string;
    month: number;
    todStartTime: string;
    todEndTime: string;
    baseEnergyRate: number;
    baseEnergyUnit: string;
    todChargePercent: number;
    energyRate: number;
  }[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const line = dataRows[i];
    const cols = parseCsvLine(line);

    if (cols.length < header.length) {
      console.warn(`Row ${i + 2}: skipping — too few columns (got ${cols.length}, expected ${header.length})`);
      skippedCount++;
      continue;
    }

    const state = cols[idx('state')].trim();
    const discomRaw = idx('discom') >= 0 ? cols[idx('discom')].trim() : '';
    const discom = discomRaw === '' ? null : discomRaw;
    const consumerCategory = cols[idx('consumer_category')].trim();
    const subCategory = cols[idx('sub-category')].trim();
    const supplyVoltageCategory = cols[idx('supply_voltage_category')].trim();
    const supplyVoltage = cols[idx('supply_voltage')].trim();
    const monthRaw = cols[idx('month')].trim();
    const todStartTime = cols[idx('tod_start_time')].trim();
    const todEndTime = cols[idx('tod_end_time')].trim();
    const baseEnergyRateRaw = cols[idx('base_energy_rate')].trim();
    const baseEnergyUnit = cols[idx('base_energy_unit')].trim();
    const todChargePercentRaw = cols[idx('tod_charge_percent')].trim();
    const energyRateRaw = cols[idx('energy_rate')].trim();

    if (!state || !consumerCategory || !monthRaw || !baseEnergyRateRaw || !energyRateRaw) {
      console.warn(`Row ${i + 2}: skipping — missing required fields`);
      skippedCount++;
      continue;
    }

    const month = parseInt(monthRaw, 10);
    const baseEnergyRate = parseFloat(baseEnergyRateRaw);
    const todChargePercent = parseInt(todChargePercentRaw, 10);
    const energyRate = parseFloat(energyRateRaw);

    if (isNaN(month) || isNaN(baseEnergyRate) || isNaN(todChargePercent) || isNaN(energyRate)) {
      console.warn(`Row ${i + 2}: skipping — numeric parse error`);
      skippedCount++;
      continue;
    }

    records.push({
      state,
      discom,
      consumerCategory,
      subCategory,
      supplyVoltageCategory,
      supplyVoltage,
      month,
      todStartTime,
      todEndTime,
      baseEnergyRate,
      baseEnergyUnit,
      todChargePercent,
      energyRate,
    });
  }

  // Batch insert
  let insertedCount = 0;
  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await prisma.stateTariff.createMany({ data: batch, skipDuplicates: false });
    insertedCount += batch.length;
    console.log(`  Inserted rows ${i + 1}–${Math.min(i + BATCH_SIZE, records.length)}...`);
  }

  console.log('\n✅ Seeding complete!');
  console.log(`   Inserted : ${insertedCount}`);
  console.log(`   Skipped  : ${skippedCount}`);
  console.log(`   Total CSV rows: ${dataRows.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
