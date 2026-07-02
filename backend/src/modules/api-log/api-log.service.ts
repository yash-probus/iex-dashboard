import prisma from '../../config/prisma';

export class ApiLogService {
  static async createLog(apiName: string, endpoint: string | null, status: 'SUCCESS' | 'ERROR', message?: string) {
    try {
      return await prisma.apiLog.create({
        data: {
          apiName,
          endpoint,
          status,
          message,
        },
      });
    } catch (error) {
      console.error(`[ApiLogService] Failed to create log for ${apiName}:`, error);
    }
  }

  static async getLogs(limit: number = 100) {
    return await prisma.apiLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}
