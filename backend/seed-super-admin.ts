import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN',
    },
    create: {
      username: 'superadmin',
      email: 'superadmin@example.com',
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Super Admin created:', superAdmin.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
