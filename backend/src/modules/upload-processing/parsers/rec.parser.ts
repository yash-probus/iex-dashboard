import { BaseParser } from './base.parser';
import { MarketType } from '../../upload/upload.types';
import { normalizeHeader } from '../upload-processing.types';

export class RecParser extends BaseParser {
  protected market: MarketType = 'REC';
  protected maxRows: number = 2000; // REC files can have many more rows than daily DAM/RTM

  protected requiredHeaders = [
    'Purchase Bid (MW)',
    'Sell Bid (MW)',
    'MCV (MW)',
    'Final Scheduled Volume (MW)',
    'MCP (Rs/MWh)'
  ];

  protected validateRow(row: any): boolean {
    const pBid = row[normalizeHeader('Purchase Bid (MW)')];
    const sBid = row[normalizeHeader('Sell Bid (MW)')];
    const mcv = row[normalizeHeader('MCV (MW)')];
    const fsv = row[normalizeHeader('Final Scheduled Volume (MW)')];
    const mcp = row[normalizeHeader('MCP (Rs/MWh)')];

    if (!this.parseNumberField(pBid) || 
        !this.parseNumberField(sBid) || 
        !this.parseNumberField(mcv) || 
        !this.parseNumberField(fsv) || 
        !this.parseNumberField(mcp)) {
      return false;
    }

    return true;
  }
}
