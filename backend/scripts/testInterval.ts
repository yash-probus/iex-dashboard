import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const dr = await prisma.damRecord.findFirst();
  console.log("DamRecord intervalTime:", dr?.intervalTime);
  const gr = await prisma.gdamRecord.findFirst();
  console.log("GdamRecord intervalTime:", gr?.intervalTime);
}
main().catch(console.error).finally(() => prisma.$disconnect());
