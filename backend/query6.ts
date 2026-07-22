import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.savingsCalculatorEntry.findMany({ where: { discom: 'NPCL' } });
  console.log('NPCL entries:');
  for (const e of entries) {
    console.log(`id: ${e.id}, stateCode: "${e.stateCode}", category: "${e.consumerCategory}"`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
