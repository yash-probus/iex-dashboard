import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const entries = await prisma.savingsCalculatorEntry.findMany({
      select: {
        id: true,
        clientName: true,
        todConsumptions: true
      }
    });
    for (const e of entries) {
      if (e.todConsumptions) {
        console.log(`Entry: ${e.clientName}`);
        console.log('todConsumptions content:', JSON.stringify(e.todConsumptions, null, 2));
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
