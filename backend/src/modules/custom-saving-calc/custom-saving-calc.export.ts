import * as ExcelJS from 'exceljs';
import { CustomSavingCalcService } from './custom-saving-calc.service';
import { SavingsCalculatorExportService } from '../savings-calculator/savings-calculator.export';

export class CustomSavingCalcExportService {
  static async exportToExcel(id: string, monthStr?: string, version?: number): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    if (!monthStr || monthStr === 'all') {
      const entry = await CustomSavingCalcService.getEntryOrVersion(id, version);
      const months = Object.keys(entry?.todConsumptions || {}).filter(m => !m.startsWith('_') && m.includes('-')).sort();
      const allResults = [];
      
      for (const m of months) {
        const result = await CustomSavingCalcService.calculateMarketDecision(id, m, version, false);
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
      const entry = await CustomSavingCalcService.getEntryOrVersion(id, version);
      const result = await CustomSavingCalcService.calculateMarketDecision(id, monthStr, version, false);
      const sheetName = monthStr;
      await (SavingsCalculatorExportService as any).addSavingsSheet(workbook, sheetName, result, entry, monthStr);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  static async exportDemandShiftToExcel(id: string, monthStr?: string, version?: number): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    if (!monthStr || monthStr === 'all') {
      const entry = await CustomSavingCalcService.getEntryOrVersion(id, version);
      const months = Object.keys(entry?.todConsumptions || {}).filter(m => !m.startsWith('_') && m.includes('-')).sort();
      const allResults = [];
      
      for (const m of months) {
        const result = await CustomSavingCalcService.calculateMarketDecision(id, m, version, true);
        allResults.push({ monthStr: m, result });
      }
      
      if (allResults.length > 0) {
        const summarySheet = workbook.addWorksheet('Summary');
        const monthRowMap: Record<string, any> = {};
        
        for (const r of allResults) {
          const sheetName = `${r.monthStr}-Shift`;
          const rowMapping = await (SavingsCalculatorExportService as any).addSavingsSheet(workbook, sheetName, r.result, entry, r.monthStr);
          monthRowMap[r.monthStr] = { sheetName, ...rowMapping };
        }
        
        await (SavingsCalculatorExportService as any).populateSummarySheet(summarySheet, entry, allResults, monthRowMap);
      }
    } else {
      const entry = await CustomSavingCalcService.getEntryOrVersion(id, version);
      const result = await CustomSavingCalcService.calculateMarketDecision(id, monthStr, version, true);
      const sheetName = `${monthStr}-Shift`;
      await (SavingsCalculatorExportService as any).addSavingsSheet(workbook, sheetName, result, entry, monthStr);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
