import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { comparePassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';
import { AuthResponse, LoginDTO } from './auth.types';

export const loginUser = async (dto: LoginDTO): Promise<AuthResponse> => {
  const { username, password } = dto;

  // 1. Find user by username
  const user = await prisma.user.findUnique({
    where: { username },
  });

  // 2. If user not found, throw generic error
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // 3. Verify password
  const isPasswordValid = await comparePassword(password as string, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken({ 
    id: user.id, 
    username: user.username, 
    role: user.role, 
    hiddenModules: user.hiddenModules,
    readOnlyModules: user.readOnlyModules
  });

  // 5. Return authenticated user data
  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      hiddenModules: user.hiddenModules,
      readOnlyModules: user.readOnlyModules
    },
  };
};
