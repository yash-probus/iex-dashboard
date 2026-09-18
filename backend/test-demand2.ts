import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entry = await prisma.savingsCalculatorNewEntry.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log("Latest entry:", entry?.id, entry?.clientName, entry?.consumerCategory, entry?.billedDemandKv);
  
  if (entry) {
    const rs = await prisma.regionState.findFirst({ where: { stateCode: entry.stateCode || '' } });
    const stateName = rs ? rs.stateName : entry.stateCode;
    const stateFormats = [stateName, stateName?.toUpperCase(), stateName?.toLowerCase(), entry.stateCode];
    
    let parsedCategory = entry.consumerCategory || '';
    if (parsedCategory.includes(' - ')) {
      parsedCategory = parsedCategory.split(' - ')[0];
    }
    
    const startStr = '2024-04-01';
    console.log("Looking for stateCharges with dates", { startStr });
    
    const sc = await prisma.stateCharges.findFirst({
      where: {
        state: { in: stateFormats as string[] },
        discom: entry.discom === 'NPCL' ? 'NPCL' : null,
        category: parsedCategory,
        fromDate: { lte: new Date(startStr) },
        toDate: { gte: new Date(startStr) },
      }
    });
    console.log("Found stateCharges:", sc?.demandFixedChargeKvaPerMonthRs);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
