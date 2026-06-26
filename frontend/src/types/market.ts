export interface BaseRecord {
  date: string;       // YYYY-MM-DD
  hour: number;       // 1-24
  timeBlock: number;  // 1-96
  purchaseBid: number; // MW
  mcp: number;        // Rs/kWh
}

export interface DAMRecord extends BaseRecord {
  sellBid: number;
  mcv: number;
  fsv: number; // Final Scheduled Volume
}

export interface GDAMRecord extends BaseRecord {
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
}

export interface RTMRecord extends DAMRecord {
  sessionId: string; // e.g., "S-01"
}

export type MarketType = 'DAM' | 'GDAM' | 'RTM';
export type AnyMarketRecord = DAMRecord | GDAMRecord | RTMRecord;

export interface MarketSummary {
  averageMcp: number;
  totalVolume: number; // Sum of FSV or MCV
  averageMcv: number;
  totalPurchaseBid: number;
  maxMcp: number;
  minMcp: number;
}
