import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const fppas = await prisma.fppaCharges.findMany({ where: { state: 'UTTAR_PRADESH' } });
  console.log('FPPAs with underscore:', fppas);
}
main().then(() => prisma.$disconnect());
