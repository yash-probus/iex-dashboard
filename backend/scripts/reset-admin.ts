import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  const passwordHash = await bcrypt.hash('admin', 10);
  
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash,
      email: 'admin@admin.com'
    },
    create: {
      username: 'admin',
      email: 'admin@admin.com',
      passwordHash
    }
  });

  console.log("Admin user created/updated with admin/admin");
}

run().catch(console.error).finally(() => prisma.$disconnect());
