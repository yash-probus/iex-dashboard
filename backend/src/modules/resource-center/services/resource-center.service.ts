import { Prisma } from '@prisma/client';
import { ResourceType } from '../types/resource-center.types';
import { RESOURCE_REGISTRY } from '../constants/resource-center.constants';
import prisma from '../../../config/prisma';
import { AppError } from '../../../utils/AppError';

/**
 * Service mapping for Resource Center DB operations.
 */

export const getResourceData = async (resourceType: ResourceType) => {
  const tableInfo = RESOURCE_REGISTRY[resourceType];
  if (!tableInfo || !tableInfo.modelName) {
    throw new Error(`Model mapping not found for resource type: ${resourceType}`);
  }
  
  // @ts-ignore - dynamic prisma model access
  const delegate = prisma[tableInfo.modelName];
  if (!delegate) {
    throw new Error(`Prisma delegate not found for model: ${tableInfo.modelName}`);
  }

  const data = await (delegate as any).findMany({
    orderBy: { id: 'asc' }
  });

  // Convert Prisma.Decimal to native JS numbers for frontend serialization
  const serializeDecimals = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'object') {
      if (Prisma.Decimal.isDecimal(obj)) {
        return obj.toNumber();
      }
      if (Array.isArray(obj)) {
        return obj.map(serializeDecimals);
      }
      const newObj: any = {};
      for (const key in obj) {
        newObj[key] = serializeDecimals(obj[key]);
      }
      return newObj;
    }
    return obj;
  };

  return serializeDecimals(data);
};

export const createResourceRecord = async (resourceType: ResourceType, payload: any) => {
  const tableInfo = RESOURCE_REGISTRY[resourceType];
  const delegate = prisma[tableInfo.modelName as keyof typeof prisma];

  try {
    if (resourceType === 'ists-charges' && payload.date) {
      payload.date = parseInt(String(payload.date).replace(/-/g, ''), 10);
    }

    const created = await (delegate as any).create({
      data: payload
    });
    return created;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new AppError('Record already exists (Duplicate Conflict)', 409);
    }
    throw error;
  }
};

export const updateResourceRecord = async (resourceType: ResourceType, id: number, payload: any) => {
  const tableInfo = RESOURCE_REGISTRY[resourceType];
  const delegate = prisma[tableInfo.modelName as keyof typeof prisma];

  // 1. Verify record exists
  const existing = await (delegate as any).findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Record not found', 404);
  }

  // 2. Update
  try {
    if (resourceType === 'ists-charges' && payload.date) {
      payload.date = parseInt(String(payload.date).replace(/-/g, ''), 10);
    }

    const updated = await (delegate as any).update({
      where: { id },
      data: payload
    });
    return updated;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new AppError('Record already exists (Duplicate Conflict)', 409);
    }
    throw error;
  }
};

export const deleteResourceRecord = async (resourceType: ResourceType, id: number) => {
  const tableInfo = RESOURCE_REGISTRY[resourceType];
  const delegate = prisma[tableInfo.modelName as keyof typeof prisma];

  // 1. Verify record exists
  const existing = await (delegate as any).findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Record not found', 404);
  }

  // 2. Hard delete
  await (delegate as any).delete({ where: { id } });
  return true;
};
