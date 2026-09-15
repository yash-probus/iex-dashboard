const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ds = await prisma.dataset.findFirst({ select: { date: true } });
  console.log("Dataset example date:", ds?.date);
  
  const rtm = await prisma.rtmRecord.findFirst({ select: { date: true } });
  console.log("RtmRecord example date:", rtm?.date);
  
  const gdam = await prisma.gdamRecord.findFirst({ select: { date: true } });
  console.log("GdamRecord example date:", gdam?.date);
  
  const dam = await prisma.damRecord.findFirst({ select: { date: true } });
  console.log("DamRecord example date:", dam?.date);
}

main().finally(() => prisma.$disconnect());
