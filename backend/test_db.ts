import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const rtmForecasts = await prisma.forecastRtm.groupBy({
    by: ['date'],
    _count: { intervalNumber: true }
  });
  console.log('RTM Forecasts by date:', rtmForecasts);

  const rtmDatasets = await prisma.dataset.findMany({
    where: { market: 'RTM' },
    select: { id: true, deliveryDate: true, fileName: true, rtmRecords: true }
  });
  console.log('RTM Actuals datasets:');
  for (const ds of rtmDatasets) {
    const recs = ds.rtmRecords as any[];
    console.log(`- ${ds.deliveryDate.toISOString().split('T')[0]}: ${recs ? recs.length : 0} records`);
  }
})();
