import * as ExcelJS from 'exceljs';
import { SavingsCalculatorNewService } from './savings-calculator-new.service';
import { SavingsCalculatorExportService } from '../savings-calculator/savings-calculator.export';

export class SavingsCalculatorNewExportService {
  static async exportToExcel(id: string, monthStr?: string, version?: number): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    if (!monthStr || monthStr === 'all') {
      const entry = await SavingsCalculatorNewService.getEntryOrVersion(id, version);
      const months = Object.keys(entry?.todConsumptions || {}).sort();
      const allResults = [];
      
      for (const m of months) {
        const result = await SavingsCalculatorNewService.calculateMarketDecision(id, m, version);
        allResults.push({ monthStr: m, result });
      }
      
      if (allResults.length > 0) {
        const summarySheet = workbook.addWorksheet('Summary');
        const monthRowMap: Record<string, any> = {};
        
        for (const r of allResults) {
          const sheetName = r.monthStr;
          const rowMapping = await (SavingsCalculatorExportService as any).addSavingsSheet(workbook, sheetName, r.result, entry, r.monthStr);
          monthRowMap[r.monthStr] = { sheetName, ...rowMapping };
        }
        
        await (SavingsCalculatorExportService as any).populateSummarySheet(summarySheet, entry, allResults, monthRowMap);
      }
    } else {
      const entry = await SavingsCalculatorNewService.getEntryOrVersion(id, version);
      const result = await SavingsCalculatorNewService.calculateMarketDecision(id, monthStr, version);
      const sheetName = monthStr;
      await (SavingsCalculatorExportService as any).addSavingsSheet(workbook, sheetName, result, entry, monthStr);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
