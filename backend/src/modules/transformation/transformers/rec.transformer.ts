import { BaseTransformer } from './base.transformer';
import { MarketType } from '../../upload/upload.types';
import { RecIntervalRecord } from '../transformation.types';

export class RecTransformer extends BaseTransformer {
  protected market: MarketType = 'REC';

  public transform(rows: Record<string, string>[]): TransformationResult {
    const records: RecIntervalRecord[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const intervalNumber = i + 1;
      
      // Extract date from "January 14-01-2026" or fallback to truncated string
      const rawMonth = rows[i]['month'] || '';
      const dateMatch = rawMonth.match(/\d{2}-\d{2}-\d{4}/);
      const intervalTime = dateMatch ? dateMatch[0] : rawMonth.substring(0, 15);
      
      try {
        records.push({
          intervalNumber,
          intervalTime,
          purchaseBid: this.extractNumber(rows[i], 'buy bids (rec)'),
          sellBid: this.extractNumber(rows[i], 'sell bids (rec)'),
          mcv: this.extractNumber(rows[i], 'cleared volume (rec)'),
          fsv: this.extractNumber(rows[i], 'cleared volume (rec)'), // Map both CVs
          mcp: this.extractNumber(rows[i], 'cleared price(rs/rec)'),
        });
      } catch (error: any) {
        warnings.push(`Row ${intervalNumber}: ${error.message}`);
        return { market: this.market, intervalCount: 0, records: [], warnings, isValid: false };
      }
    }

    return {
      market: this.market,
      intervalCount: records.length,
      records,
      warnings,
      isValid: true
    };
  }

  // Not used directly because transform is overridden, but required by BaseTransformer signature
  protected mapRow(row: Record<string, string>, intervalNumber: number, intervalTime: string): RecIntervalRecord {
    return {} as RecIntervalRecord;
  }
}
