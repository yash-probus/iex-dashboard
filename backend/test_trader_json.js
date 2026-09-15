const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const entry = await prisma.savingsCalculatorEntry.findFirst({
    where: { todConsumptions: { not: { equals: null } } }
  });
  if (entry) {
    const data = entry.todConsumptions;
    for (const [m, cons] of Object.entries(data)) {
      if (cons && cons.traderReports && cons.traderReports.data) {
        console.log(`Found trader reports in month ${m}`);
        for (const [filename, report] of Object.entries(cons.traderReports.data)) {
          console.log(`  Report: ${filename} - delivery_date: ${report.delivery_date}`);
          console.log(`  Parsing:`, new Date(report.delivery_date).toISOString().split('T')[0]);
          return;
        }
      }
    }
  }
  console.log('No trader reports found');
}
main().finally(() => prisma.$disconnect());
