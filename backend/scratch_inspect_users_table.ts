import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  console.log("=== USER TABLE ===");
  console.log(users.map(u => ({ id: u.id, email: u.email, username: u.username, role: u.role })));
  process.exit(0);
}

run().catch(console.error);
