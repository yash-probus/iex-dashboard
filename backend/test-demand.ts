import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entryId = 'c02e1c75-3b95-46b0-9b88-5182da9b936a'; // I need to get the latest entry id.
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
    
    console.log("Looking for stateCharges with:", { stateFormats, category: parsedCategory, discom: entry.discom });
    
    const sc = await prisma.stateCharges.findFirst({
      where: {
        state: { in: stateFormats as string[] },
        discom: entry.discom === 'NPCL' ? 'NPCL' : null,
        category: parsedCategory,
      }
    });
    console.log("Found stateCharges:", sc?.demandFixedChargeKvaPerMonthRs);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
