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
      sellBidSolar: this.extractNumber(row, 'solar bid (mw)'),
      sellBidNonSolar: this.extractNumber(row, 'non-solar sell bid (mw)'),
      sellBidHydro: this.extractNumber(row, 'hydro sell bid (mw)'),
      sellBidWind: this.extractNumber(row, 'wind sell bid (mw)'),
      sellBidOtherRE: this.extractNumber(row, 'other re sell bid (mw)'),
      sellBidORE: this.extractNumber(row, 'ore sell bid (mw)'),
      
      mcvTotal: this.extractNumber(row, 'total mcv (mw)'),
      mcvSolar: this.extractNumber(row, 'solar mcv (mw)'),
      mcvNonSolar: this.extractNumber(row, 'non-solar mcv (mw)'),
      mcvHydro: this.extractNumber(row, 'hydro mcv (mw)'),
      mcvWind: this.extractNumber(row, 'wind mcv (mw)'),
      mcvOtherRE: this.extractNumber(row, 'other re mcv (mw)'),
      mcvORE: this.extractNumber(row, 'ore mcv (mw)'),
      
      fsvTotal: this.extractNumber(row, 'total fsv (mw)'),
      fsvSolar: this.extractNumber(row, 'solar fsv (mw)'),
      fsvNonSolar: this.extractNumber(row, 'non-solar fsv (mw)'),
      fsvHydro: this.extractNumber(row, 'hydro fsv (mw)'),
      fsvWind: this.extractNumber(row, 'wind fsv (mw)'),
      fsvOtherRE: this.extractNumber(row, 'other re fsv (mw)'),
      fsvORE: this.extractNumber(row, 'ore fsv (mw)'),
      
      mcp: this.extractNumber(row, 'mcp (rs/mwh)'),
    };
  }
}
