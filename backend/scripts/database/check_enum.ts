import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const res = await prisma.$queryRawUnsafe(`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'state_ut_enum'`);
  console.log(res);
}

run().finally(() => prisma.$disconnect());
