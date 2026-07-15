import { PrismaClient } from '@prisma/client';
import { VidyutPravahScraper } from '../src/services/scraper.service';
import { NppAdjustmentService } from '../src/modules/dataset/npp-adjustment.service';

const prisma = new PrismaClient();

async function backfillDate(dateStr: string) {
  console.log(`Backfilling NPP Data for ${dateStr}...`);
  
  const data = await VidyutPravahScraper.getNppDemandData(dateStr);
  if (data && data.length > 0) {
    const res = await prisma.nppRawDemandData.createMany({
      data: data.map(d => ({
        date: d.date,
        timeStr: d.timeStr,
        demandMet: d.demandMet,
        dataUpdatedAt: d.dataUpdatedAt,
        fetchedAt: new Date(),
      })),
      skipDuplicates: true
    });
    console.log(`[Demand] Inserted ${res.count} new records for ${dateStr}. Total available: ${data.length}`);
    await NppAdjustmentService.updateAdjustedDemandForDate(dateStr);
  } else {
    console.log(`[Demand] No data found for ${dateStr}.`);
  }

  const genData = await VidyutPravahScraper.getNppGenerationData(dateStr);
  if (genData && genData.length > 0) {
    const res = await prisma.nppRawGenerationData.createMany({
      data: genData.map(g => ({
        date: g.date,
        timeStr: g.timeStr,
        thermal: g.thermal,
        gas: g.gas,
        nuclear: g.nuclear,
        hydro: g.hydro,
        wind: g.wind,
        solar: g.solar,
        dataUpdatedAt: g.dataUpdatedAt,
        fetchedAt: new Date(),
      })),
      skipDuplicates: true
    });
    console.log(`[Generation] Inserted ${res.count} new records for ${dateStr}. Total available: ${genData.length}`);
    await NppAdjustmentService.updateAdjustedGenerationForDate(dateStr);
  } else {
    console.log(`[Generation] No data found for ${dateStr}.`);
  }
}

async function run() {
  try {
    await backfillDate('2026-07-14');
    await backfillDate('2026-07-15');
    console.log('Backfill complete!');
  } catch (error) {
    console.error('Error during backfill:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
