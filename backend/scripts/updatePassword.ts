import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const newPassword = 'admin';

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await prisma.admin.update({
    where: { username },
    data: { passwordHash }
  });

  console.log('Password updated successfully for admin.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
