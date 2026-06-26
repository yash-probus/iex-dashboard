import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@iexdashboard.local';
  const password = process.env.ADMIN_PASSWORD || 'securepassword';

  // 1. Check if admin exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { username },
  });

  if (existingAdmin) {
    console.log(`Admin user '${username}' already exists. Skipping seed to prevent password overwrite.`);
    return;
  }

  // 2. Hash the password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // 3. Create admin
  const admin = await prisma.admin.create({
    data: {
      username,
      email,
      passwordHash,
    },
  });

  console.log('Admin user seeded successfully:', admin.username);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
