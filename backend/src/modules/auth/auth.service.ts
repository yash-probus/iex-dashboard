import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { comparePassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';
import { AuthResponse, LoginDTO } from './auth.types';

export const loginAdmin = async (dto: LoginDTO): Promise<AuthResponse> => {
  const { username, password } = dto;

  // 1. Find admin by username
  const admin = await prisma.admin.findUnique({
    where: { username },
  });

  // 2. If admin not found, throw generic error
  if (!admin) {
    throw new AppError('Invalid credentials', 401);
  }

  // 3. Verify password
  const isPasswordValid = await comparePassword(password as string, admin.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // 4. Generate JWT
  const token = generateToken({ id: admin.id, username: admin.username });

  // 5. Return authenticated admin data
  return {
    success: true,
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
    },
  };
};
