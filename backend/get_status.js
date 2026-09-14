const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.savingsCalculatorEntry.count();
  console.log("Total entries:", c);
}
main().finally(() => prisma.$disconnect());
