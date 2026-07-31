const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  try {
    const csvContent = fs.readFileSync('../backend_tables_updated - ists_losses.csv', 'utf-8');
    const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Skip header
    const dataLines = lines.slice(1);
    
    // Clear all existing entries and reset the ID sequence to 1!
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."ists_charges" RESTART IDENTITY CASCADE;`);
    console.log('Cleared all existing ISTS records and reset IDs to 1.');
    
    let success = 0;
    
    for (const line of dataLines) {
      const parts = line.split(',');
      if (parts.length >= 3) {
        const rawStart = parts[0].trim().replace(/\//g, '-');
        const rawEnd = parts[1].trim().replace(/\//g, '-');
        const lossPercent = parseFloat(parts[2].trim());
        
        if (isNaN(lossPercent)) continue;
        
        const startDate = new Date(`${rawStart}T00:00:00.000Z`);
        const endDate = new Date(`${rawEnd}T00:00:00.000Z`);
        
        await prisma.istsCharges.upsert({
          where: {
            startDate_endDate: {
              startDate,
              endDate
            }
          },
          update: {
            istsLossPercent: lossPercent
          },
          create: {
            startDate,
            endDate,
            istsLossPercent: lossPercent
          }
        });
        success++;
      }
    }
    console.log(`Successfully upserted ${success} ISTS records from CSV!`);
  } catch (err) {
    console.error('Error seeding CSV:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
