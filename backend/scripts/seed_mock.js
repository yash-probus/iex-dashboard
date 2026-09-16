const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

async function run() {
  const parsedData = JSON.parse(fs.readFileSync(path.join(__dirname, '../parsed_pdfs.json')));
  
  const todConsumptions = {
    '2026-08': {
      traderReports: parsedData,
      'Start Date': '2026-08-01',
      'End Date': '2026-08-31'
    }
  };
  
  try {
    const existing = await prisma.traderPerformanceEntry.findUnique({ where: { id: '66d1cf98f02f83c180da1d0d' } });
    if (existing) {
      await prisma.traderPerformanceEntry.update({
        where: { id: '66d1cf98f02f83c180da1d0d' },
        data: { todConsumptions }
      });
      console.log("Updated existing");
    } else {
      await prisma.traderPerformanceEntry.create({
        data: {
          id: '66d1cf98f02f83c180da1d0d',
          clientName: 'Yash Test Client',
          industryName: 'Test Industry',
          address: 'Test Address',
          sanctionedLoadKw: 1108.8,
          consumerCategory: 'Industrial',
          voltageLevel: '11 kV',
          todConsumptions
        }
      });
      console.log("Created mock entry");
    }
  } catch (e) {
    console.error("Prisma error:", e);
  }
  process.exit(0);
}
run();
