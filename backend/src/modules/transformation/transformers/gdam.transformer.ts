import { BaseTransformer } from './base.transformer';
import { MarketType } from '../../upload/upload.types';
import { GdamIntervalRecord } from '../transformation.types';

export class GdamTransformer extends BaseTransformer {
  protected market: MarketType = 'GDAM';

  protected mapRow(row: Record<string, string>, intervalNumber: number, intervalTime: string): GdamIntervalRecord {
    return {
      intervalNumber,
      intervalTime,
      purchaseBid: this.extractNumber(row, 'purchase bid (mw)'),
      sellBidTotal: this.extractNumber(row, 'total sell bid (mw)'),
      sellBidSolar: this.extractNumber(row, 'solar bid (mw)'), // The sample verified shape uses 'solar bid (mw)' not 'solar sell bid'
      sellBidNonSolar: this.extractNumber(row, 'non-solar sell bid (mw)'),
      sellBidHydro: this.extractNumber(row, 'hydro sell bid (mw)'),
      
      mcvTotal: this.extractNumber(row, 'total mcv (mw)'),
      mcvSolar: this.extractNumber(row, 'solar mcv (mw)'),
      mcvNonSolar: this.extractNumber(row, 'non-solar mcv (mw)'),
      mcvHydro: this.extractNumber(row, 'hydro mcv (mw)'),
      
      fsvTotal: this.extractNumber(row, 'total fsv (mw)'),
      fsvSolar: this.extractNumber(row, 'solar fsv (mw)'),
      fsvNonSolar: this.extractNumber(row, 'non-solar fsv (mw)'),
      fsvHydro: this.extractNumber(row, 'hydro fsv (mw)'),
      
      mcp: this.extractNumber(row, 'mcp (rs/mwh)'),
    };
  }
}
