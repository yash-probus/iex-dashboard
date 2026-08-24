import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user_details.findMany();
  console.log("=== USER DETAILS ===");
  console.log(users);
  process.exit(0);
}

run().catch(console.error);
