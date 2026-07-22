import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.savingsCalculatorEntry.findMany();
  console.log('All entries:');
  for (const e of entries) {
    console.log(`id: ${e.id}, discom: "${e.discom}", stateCode: "${e.stateCode}", category: "${e.consumerCategory}"`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
