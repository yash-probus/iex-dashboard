const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const st = await prisma.stateTariff.findMany({ 
    where: { 
      discom: 'NPCL'
    } 
  });
  console.log('Total NPCL Tariffs in DB:', st.length);
  const categories = new Set();
  for (const item of st) {
    categories.add(item.consumerCategory);
  }
  console.log('NPCL Categories in DB:', Array.from(categories));
}
main().catch(console.error).finally(() => prisma.$disconnect());
