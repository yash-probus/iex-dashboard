import { MarketType } from '../upload/upload.types';

export interface DamIntervalRecord {
  intervalNumber: number;
  intervalTime: string;
  purchaseBid: number;
  sellBid: number;
  mcv: number;
  fsv: number;
  mcp: number;
}

export interface GdamIntervalRecord {
  intervalNumber: number;
  intervalTime: string;
  purchaseBid: number;
  sellBidTotal: number;
  sellBidSolar: number;
  sellBidNonSolar: number;
  sellBidHydro: number;
  mcvTotal: number;
  mcvSolar: number;
  mcvNonSolar: number;
  mcvHydro: number;
  fsvTotal: number;
  fsvSolar: number;
  fsvNonSolar: number;
  fsvHydro: number;
  mcp: number;
}

export interface RtmIntervalRecord {
  intervalNumber: number;
  intervalTime: string;
  sessionId: string;
  purchaseBid: number;
  sellBid: number;
  mcv: number;
  fsv: number;
  mcp: number;
}

export interface TransformationResult {
  market: MarketType;
  intervalCount: number;
  records: unknown[]; // Contains DamIntervalRecord[] | GdamIntervalRecord[] | RtmIntervalRecord[]
  warnings: string[];
  isValid: boolean;
}

export interface ITransformer {
  transform(rows: Record<string, string>[]): TransformationResult;
}
