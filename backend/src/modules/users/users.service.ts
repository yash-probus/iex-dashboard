import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { hashPassword } from '../../utils/password';
import { Role } from '@prisma/client';

export class UsersService {
  static async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        hiddenModules: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createUser(data: any) {
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email }
        ]
      }
    });

    if (existingUser) {
      throw new AppError('Username or email already exists', 400);
    }

    const passwordHash = await hashPassword(data.password);

    const newUser = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        role: data.role as Role,
        hiddenModules: Array.isArray(data.hiddenModules) ? data.hiddenModules : []
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        hiddenModules: true,
        createdAt: true,
      }
    });

    return newUser;
  }

  static async updateUser(id: string, data: any) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updateData: any = {};
    if (data.username) updateData.username = data.username;
    if (data.email) updateData.email = data.email;
    if (data.role) {
      updateData.role = data.role as Role;
    }

    if (Array.isArray(data.hiddenModules)) {
      updateData.hiddenModules = data.hiddenModules;
    }

    if (data.password) updateData.passwordHash = await hashPassword(data.password);

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        hiddenModules: true,
        createdAt: true,
      }
    });
  }

  static async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}
