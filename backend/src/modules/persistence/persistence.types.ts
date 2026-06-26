import { Prisma } from '@prisma/client';

export type DamDbPayload = Prisma.DamRecordCreateManyInput;
export type GdamDbPayload = Prisma.GdamRecordCreateManyInput;
export type RtmDbPayload = Prisma.RtmRecordCreateManyInput;

export interface PersistDatasetParams {
  market: 'DAM' | 'GDAM' | 'RTM';
  deliveryDate: Date;
  fileName: string;
  records: unknown[]; // Raw interval objects mapped from the transformation engine
  action?: string;
}
