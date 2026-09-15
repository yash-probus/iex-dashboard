const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.savingsCalculatorEntry.findMany();
  for (const entry of entries) {
    if (entry.todConsumptions) {
      const jsonStr = JSON.stringify(entry.todConsumptions);
      if (jsonStr.includes('traderReports')) {
        console.log(`Entry ${entry.id} has trader reports!`);
        console.log(jsonStr.substring(jsonStr.indexOf('traderReports'), jsonStr.indexOf('traderReports') + 500));
        return;
      }
    }
  }
  console.log("None found");
}
main().finally(() => prisma.$disconnect());
