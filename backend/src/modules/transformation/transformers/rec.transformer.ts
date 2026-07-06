import { BaseTransformer } from './base.transformer';
import { MarketType } from '../../upload/upload.types';
import { RecIntervalRecord } from '../transformation.types';

export class RecTransformer extends BaseTransformer {
  protected market: MarketType = 'REC';

  protected mapRow(row: Record<string, string>, intervalNumber: number, intervalTime: string): RecIntervalRecord {
    return {
      intervalNumber,
      intervalTime,
      purchaseBid: this.extractNumber(row, 'purchase bid (mw)'),
      sellBid: this.extractNumber(row, 'sell bid (mw)'),
      mcv: this.extractNumber(row, 'mcv (mw)'),
      fsv: this.extractNumber(row, 'final scheduled volume (mw)'),
      mcp: this.extractNumber(row, 'mcp (rs/mwh)'),
    };
  }
}
