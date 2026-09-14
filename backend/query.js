const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.traderPerformanceEntry.findMany({ take: 10 });
  for (const entry of entries) {
    if (entry.todConsumptions) {
      const mc = entry.todConsumptions;
      for (const monthKey in mc) {
        if (mc[monthKey].traderReports && mc[monthKey].traderReports.data) {
          const reports = mc[monthKey].traderReports.data;
          const first = Object.values(reports)[0];
          console.log("Found delivery_date:", first.delivery_date);
          console.log("Parsed Date:", new Date(first.delivery_date).toISOString());
          return;
        }
      }
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
