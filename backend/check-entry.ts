import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entry = await prisma.savingsCalculatorNewEntry.findUnique({
    where: { id: '2c0bb9b2-ee51-4187-8fa3-d71863c67cfa' }
  });
  console.log("entry:", entry?.id);
  console.log("discom:", entry?.discom);
  console.log("category:", entry?.consumerCategory);
  console.log("todConsumptions:", JSON.stringify(entry?.todConsumptions, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
