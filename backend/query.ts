const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sc = await prisma.stateCharges.findMany({ where: { state: 'UTTAR_PRADESH', category: 'HV-2' } });
  console.log('StateCharges length:', sc.length);
  for (const item of sc) {
     console.log(`from: ${item.fromDate}, to: ${item.toDate}, voltage: ${item.voltageLevel}, stuLoss: ${item.stuLossPercent}, wheelingLoss: ${item.wheelingLossPercent}`);
  }
  
  const ic = await prisma.istsCharges.findMany();
  console.log('IstsCharges length:', ic.length);
  for (const item of ic) {
     console.log(`from: ${item.startDate}, to: ${item.endDate}, loss: ${item.istsLossPercent}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
