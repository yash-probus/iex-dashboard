const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function toYMD(d) {
  if (d && d.length === 10 && d.charAt(2) === '-' && d.charAt(5) === '-') {
    const parts = d.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return null;
}

async function fixDates() {
  let rtmUpdated = 0, damUpdated = 0, gdamUpdated = 0, datasetUpdated = 0;
  
  const rtms = await prisma.rtmRecord.findMany({ select: { id: true, date: true }});
  for (const r of rtms) {
    const newDate = toYMD(r.date);
    if (newDate) {
      await prisma.rtmRecord.update({ where: { id: r.id }, data: { date: newDate } });
      rtmUpdated++;
    }
  }

  const dams = await prisma.damRecord.findMany({ select: { id: true, date: true }});
  for (const d of dams) {
    const newDate = toYMD(d.date);
    if (newDate) {
      await prisma.damRecord.update({ where: { id: d.id }, data: { date: newDate } });
      damUpdated++;
    }
  }

  const gdams = await prisma.gdamRecord.findMany({ select: { id: true, date: true }});
  for (const g of gdams) {
    const newDate = toYMD(g.date);
    if (newDate) {
      await prisma.gdamRecord.update({ where: { id: g.id }, data: { date: newDate } });
      gdamUpdated++;
    }
  }

  const ds = await prisma.dataset.findMany({ select: { id: true, deliveryDate: true }});
  for (const d of ds) {
    const newDate = toYMD(d.deliveryDate);
    if (newDate) {
      await prisma.dataset.update({ where: { id: d.id }, data: { deliveryDate: newDate } });
      datasetUpdated++;
    }
  }

  console.log(`Updated RTM: ${rtmUpdated}, DAM: ${damUpdated}, GDAM: ${gdamUpdated}, Dataset: ${datasetUpdated}`);
}

fixDates().catch(console.error).finally(() => prisma.$disconnect());
