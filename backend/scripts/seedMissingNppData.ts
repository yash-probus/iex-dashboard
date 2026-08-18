import { VidyutPravahScraper } from '../src/services/scraper.service';
import { NppAdjustmentService } from '../src/modules/dataset/npp-adjustment.service';
import prisma from '../src/config/prisma';

async function seedMissing() {
  console.log('[Seed] Starting NPP Demand & Generation backfill for missing dates...');

  // Generate date array from 2026-08-04 to today (2026-08-18)
  const startDate = new Date('2026-08-04');
  const endDate = new Date('2026-08-18');

  const dates: string[] = [];
  const curr = new Date(startDate);
  while (curr <= endDate) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }

  console.log(`[Seed] Processing ${dates.length} dates:`, dates);

  for (const dateStr of dates) {
    console.log(`\n--- Fetching data for ${dateStr} ---`);
    
    // 1. Fetch Demand Data
    try {
      const demandData = await VidyutPravahScraper.getNppDemandData(dateStr);
      if (demandData && demandData.length > 0) {
        await prisma.nppRawDemandData.createMany({
          data: demandData.map(d => ({
            date: d.date,
            timeStr: d.timeStr,
            demandMet: d.demandMet,
            dataUpdatedAt: d.dataUpdatedAt,
            fetchedAt: new Date(),
          })),
          skipDuplicates: true
        });
        console.log(`[Seed] Inserted ${demandData.length} raw demand records for ${dateStr}`);
        await NppAdjustmentService.updateAdjustedDemandForDate(dateStr);
        console.log(`[Seed] Updated adjusted demand for ${dateStr}`);
      } else {
        console.log(`[Seed] No demand data returned for ${dateStr}`);
      }
    } catch (e: any) {
      console.error(`[Seed] Error backfilling demand for ${dateStr}:`, e.message);
    }

    // 2. Fetch Generation Data
    try {
      const genData = await VidyutPravahScraper.getNppGenerationData(dateStr);
      if (genData && genData.length > 0) {
        await prisma.nppRawGenerationData.createMany({
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
        console.log(`[Seed] Inserted ${genData.length} raw generation records for ${dateStr}`);
        await NppAdjustmentService.updateAdjustedGenerationForDate(dateStr);
        console.log(`[Seed] Updated adjusted generation for ${dateStr}`);
      } else {
        console.log(`[Seed] No generation data returned for ${dateStr}`);
      }
    } catch (e: any) {
      console.error(`[Seed] Error backfilling generation for ${dateStr}:`, e.message);
    }
  }

  console.log('\n[Seed] Backfill process completed successfully!');
}

seedMissing()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('[Seed] Backfill failed:', err);
    process.exit(1);
  });
