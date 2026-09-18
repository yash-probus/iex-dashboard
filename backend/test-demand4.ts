import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entry = await prisma.savingsCalculatorNewEntry.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (entry && entry.todConsumptions) {
    const keys = Object.keys(entry.todConsumptions);
    console.log("Months:", keys);
    if (keys.length > 0) {
      const monthData = (entry.todConsumptions as any)[keys[0]];
      console.log("Keys in monthData:", Object.keys(monthData));
      console.log("Values for 'peak demand' related:", Object.keys(monthData).filter(k => k.toLowerCase().includes('peak') || k.toLowerCase().includes('demand')));
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
