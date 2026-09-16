const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.traderPerformanceActualEntry.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  if (entries.length > 0) {
    const entry = entries[0];
    console.log("Found entry:", entry.clientName);
    const months = Object.keys(entry.todConsumptions || {}).filter(k => k.match(/^\d{4}-\d{2}$/));
    for (const month of months) {
       const reports = entry.todConsumptions[month].traderReports;
       if (reports && reports.data) {
         const dates = Object.keys(reports.data);
         console.log("Month", month, "has trader reports for", dates.length, "dates.");
         if (dates.length > 0) {
           console.log("Sample date data:", dates[0]);
           const sampleDate = reports.data[dates[0]];
           const slots = Object.keys(sampleDate);
           if (slots.length > 0) {
             console.log("Sample slot:", slots[0]);
             console.log("Trades in slot:", sampleDate[slots[0]]);
           } else {
             console.log("No slots found for date", dates[0]);
           }
         }
       } else {
         console.log("Month", month, "has NO trader reports.");
       }
    }
  } else {
    console.log("No entries found");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
