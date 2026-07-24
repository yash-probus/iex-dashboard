import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  // Take file path from command line arg, or default to a relative path
  const filePath = process.argv[2] || 'GDAM_Market Snapshot.xlsx';
  console.log(`Reading Excel file from: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

  // Find header row
  let headerRowIndex = -1;
  for (let i = 0; i < jsonData.length; i++) {
    if (jsonData[i][0] === 'Date' && jsonData[i][2] === 'Time Block') {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Could not find header row');
  }

  const parseNumber = (val: any) => {
    if (val === undefined || val === null || val === '-' || val === '') return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
  };

  const recordsByDate = new Map<string, any[]>();

  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length < 20 || row[0] === 'Total (MWh)' || row[0] === 'Max (MW)' || row[0] === 'Min (MW)' || row[0] === 'Avg (MW)') {
      continue;
    }
    
    // Sometimes there are empty rows or summary rows at the end
    const dateStr = row[0]; // e.g. '24-07-2026'
    if (!dateStr || !dateStr.includes('-')) continue;
    
    const [dd, mm, yyyy] = dateStr.split('-');
    const isoDateStr = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;

    const timeBlock = row[2];
    const [start] = timeBlock.split(' - ');
    const [hh, min] = start.split(':').map(Number);
    const intervalNumber = (hh * 4) + (min / 15) + 1;

    const record = {
      date: dateStr,
      intervalNumber,
      intervalTime: start.trim(),
      purchaseBid: parseNumber(row[3]),
      sellBidTotal: parseNumber(row[4]),
      sellBidHydro: parseNumber(row[5]),
      sellBidWind: parseNumber(row[6]),
      sellBidOtherRE: parseNumber(row[7]),
      sellBidDRE: parseNumber(row[8]),
      
      mcvTotal: parseNumber(row[9]),
      mcvHydro: parseNumber(row[10]),
      mcvWind: parseNumber(row[11]),
      mcvOtherRE: parseNumber(row[12]),
      mcvDRE: parseNumber(row[13]),
      
      fsvTotal: parseNumber(row[14]),
      fsvHydro: parseNumber(row[15]),
      fsvWind: parseNumber(row[16]),
      fsvOtherRE: parseNumber(row[17]),
      fsvDRE: parseNumber(row[18]),
      
      mcp: parseNumber(row[19]),
    };

    if (!recordsByDate.has(isoDateStr)) {
      recordsByDate.set(isoDateStr, []);
    }
    recordsByDate.get(isoDateStr)!.push(record);
  }

  for (const [isoDate, records] of Array.from(recordsByDate.entries())) {
    const dateObj = new Date(isoDate);
    
    // Find dataset
    let dataset = await prisma.dataset.findFirst({
      where: {
        market: 'GDAM',
        deliveryDate: dateObj,
        status: 'ACTIVE'
      }
    });

    if (!dataset) {
      console.log(`No active dataset found for GDAM on ${isoDate}. Creating one...`);
      dataset = await prisma.dataset.create({
        data: {
          market: 'GDAM',
          deliveryDate: dateObj,
          status: 'ACTIVE',
          fileName: `seeded_gdam_${isoDate.split('T')[0]}.xlsx`
        }
      });
    }

    console.log(`Dataset for ${isoDate} is ${dataset.id}. Deleting old GdamNewRecords and inserting ${records.length} new ones...`);
    
    // Delete existing
    await prisma.gdamNewRecord.deleteMany({
      where: { datasetId: dataset.id }
    });

    // Add datasetId to records
    const dataToInsert = records.map(r => ({
      ...r,
      datasetId: dataset.id
    }));

    await prisma.gdamNewRecord.createMany({
      data: dataToInsert
    });

    console.log(`Successfully inserted ${dataToInsert.length} records for ${isoDate}`);
  }

  console.log('Seeding complete.');
}

run().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
