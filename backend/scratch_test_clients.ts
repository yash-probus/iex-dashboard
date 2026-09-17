import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.$queryRawUnsafe(`
    SELECT "id", "client_name", "created_at"
    FROM "public"."savings_calculator_new_entries" 
    ORDER BY "created_at" DESC
    LIMIT 10
  `);
  console.log(entries);
}
main().finally(() => prisma.$disconnect());
