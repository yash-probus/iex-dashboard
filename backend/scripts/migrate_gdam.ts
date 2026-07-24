import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateData() {
  console.log('Starting migration from GdamRecord to GdamNewRecord for dates >= July 13, 2026');
  
  const transitionDate = new Date('2026-07-13T00:00:00.000Z');
  
  const affectedDatasets = await prisma.dataset.findMany({
    where: {
      market: 'GDAM',
      deliveryDate: {
        gte: transitionDate
      }
    }
  });

  console.log(`Found ${affectedDatasets.length} datasets to migrate.`);

  for (const ds of affectedDatasets) {
    console.log(`Migrating dataset: ${ds.id} (${ds.deliveryDate.toISOString()})`);
    
    const oldRecords = await prisma.gdamRecord.findMany({
      where: { datasetId: ds.id }
    });
    
    if (oldRecords.length === 0) {
      console.log(`No old records found for dataset ${ds.id}`);
      continue;
    }
    
    console.log(`Found ${oldRecords.length} old records to migrate.`);
    
    const newRecords = oldRecords.map(r => {
      return {
        datasetId: r.datasetId,
        date: r.date,
        intervalNumber: r.intervalNumber,
        intervalTime: r.intervalTime,
        mcp: r.mcp,
        purchaseBid: r.purchaseBid,
        
        sellBidTotal: r.sellBidTotal,
        sellBidHydro: r.sellBidHydro,
        sellBidWind: r.sellBidWind,
        sellBidOtherRE: r.sellBidOtherRE,
        sellBidDRE: r.sellBidSolar || 0,
        
        mcvTotal: r.mcvTotal,
        mcvHydro: (r as any).mcvHydro || 0,
        mcvWind: (r as any).mcvWind || 0,
        mcvOtherRE: (r as any).mcvOtherRE || 0,
        mcvDRE: r.mcvSolar || 0,
        
        fsvTotal: (r as any).fsvTotal || 0,
        fsvHydro: (r as any).fsvHydro || 0,
        fsvWind: (r as any).fsvWind || 0,
        fsvOtherRE: (r as any).fsvOtherRE || 0,
        fsvDRE: (r as any).fsvSolar || 0,
      };
    });
    
    await prisma.gdamNewRecord.createMany({
      data: newRecords
    });
    
    await prisma.gdamRecord.deleteMany({
      where: { datasetId: ds.id }
    });
    
    console.log(`Successfully migrated ${newRecords.length} records for dataset ${ds.id}`);
  }
  
  console.log('Migration completed successfully.');
}

migrateData().catch(e => {
  console.error(e);
}).finally(async () => {
  await prisma.$disconnect();
});
