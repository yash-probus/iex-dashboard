import { PrismaClient } from '@prisma/client';
import { NppAdjustmentService } from '../src/modules/dataset/npp-adjustment.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching unique dates from NppRawDemandData...');
  const demandDatesRaw = await prisma.nppRawDemandData.findMany({
    select: { date: true },
    distinct: ['date']
  });

  const demandDates = demandDatesRaw.map(d => d.date);
  console.log(`Found ${demandDates.length} unique dates for demand data.`);

  for (const date of demandDates) {
    console.log(`Updating adjusted demand for date: ${date}`);
    await NppAdjustmentService.updateAdjustedDemandForDate(date);
  }

  console.log('Fetching unique dates from NppRawGenerationData...');
  const genDatesRaw = await prisma.nppRawGenerationData.findMany({
    select: { date: true },
    distinct: ['date']
  });

  const genDates = genDatesRaw.map(d => d.date);
  console.log(`Found ${genDates.length} unique dates for generation data.`);

  for (const date of genDates) {
    console.log(`Updating adjusted generation for date: ${date}`);
    await NppAdjustmentService.updateAdjustedGenerationForDate(date);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
