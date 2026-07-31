import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const rows = await prisma.forecastGdam.findMany({
    select: { date: true },
    distinct: ['date'],
    orderBy: { date: 'desc' }
  });
  console.log(rows.map(r => r.date));
}
main().catch(console.error).finally(() => prisma.$disconnect());
