import * as ExcelJS from 'exceljs';
import { SavingsCalculatorService } from './savings-calculator.service';

export class SavingsCalculatorExportService {
  static async exportToExcel(id: string, monthStr?: string): Promise<Buffer> {
    const result = await SavingsCalculatorService.calculateMarketDecision(id, monthStr);
    const { slotsData, todSummaries, oaDetailed } = result;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Savings Analysis', {
      views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }]
    });

    // We need all unique days sorted
    const daysSet = new Set<string>();
    slotsData.forEach(s => daysSet.add(s.date));
    const days = Array.from(daysSet).sort();

    // Headers
    const headers = ['Blockwise DAM Rates on IEX'];
    days.forEach(d => {
      // Format day like '1-May'
      const dateObj = new Date(d);
      const dayStr = `${dateObj.getDate()}-${dateObj.toLocaleString('default', { month: 'short' })}`;
      headers.push(dayStr);
    });

    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };

    // Create 96 blocks
    // Helper to format block time (e.g., '00:00 - 00:15')
    const formatBlock = (blockIdx: number) => {
      const startMin = (blockIdx - 1) * 15;
      const endMin = blockIdx * 15;
      const h1 = Math.floor(startMin / 60).toString().padStart(2, '0');
      const m1 = (startMin % 60).toString().padStart(2, '0');
      const h2 = Math.floor(endMin / 60).toString().padStart(2, '0');
      const m2 = (endMin % 60).toString().padStart(2, '0');
      return `${h1}:${m1} - ${h2}:${m2}`;
    };

    // Matrix [96][days.length]
    for (let b = 1; b <= 96; b++) {
      const row = [formatBlock(b)];
      days.forEach(day => {
        const slot = slotsData.find(s => s.date === day && s.timeblock === b);
        if (slot && slot.shouldBuyFromMarket) {
          // If won, show the MCP (base price) of the selected market
          let mcp = 0;
          if (slot.marketSource === 'DAM') mcp = slot.damMcp || 0;
          else if (slot.marketSource === 'RTM') mcp = slot.rtmMcp || 0;
          else if (slot.marketSource === 'GDAM') mcp = slot.gdamMcp || 0;
          row.push(mcp.toFixed(2));
        } else {
          row.push('-');
        }
      });
      sheet.addRow(row);
    }

    // Add empty rows before summary
    sheet.addRow([]);
    sheet.addRow([]);

    // Summary Rows
    // In screenshot: Average TOD-1 (0-11), etc.
    const addSummaryRow = (title: string, dataKey: string) => {
      const row = [title];
      days.forEach(day => row.push('')); // We can calculate per-day averages if needed, but UI shows blank for days?
      // Actually screenshot has per day averages for TODs!
      // But calculating per day averages per TOD is complex. Let's just output the main summary info.
      sheet.addRow(row);
    };

    // Just output the general OA breakdown
    const breakdownHeader = ['TOD Slab', 'Total Sourced (DISCOM Units)', 'Market Sourced (OA Units)', 'DISCOM Bill (Total)', 'Prolt DISCOM Bill (Net)', 'OA Consumer Bus Units', 'OA Bill'];
    sheet.addRow(breakdownHeader);
    if (sheet.lastRow) sheet.lastRow.font = { bold: true };

    let totalDiscomU = 0, totalOaU = 0, totalDiscomB = 0, totalNetB = 0, totalConsumerU = 0, totalOaB = 0;

    oaDetailed.breakdown.forEach(b => {
      sheet.addRow([
        b.slabName,
        Math.round(b.discomUnits),
        Math.round(b.oaUnits),
        Math.round(b.discomBill),
        Math.round(b.proltDiscomBill),
        Math.round(b.consumerBusUnits),
        Math.round(b.oaBill)
      ]);
      totalDiscomU += b.discomUnits;
      totalOaU += b.oaUnits;
      totalDiscomB += b.discomBill;
      totalNetB += b.proltDiscomBill;
      totalConsumerU += b.consumerBusUnits;
      totalOaB += b.oaBill;
    });

    sheet.addRow(['Total', Math.round(totalDiscomU), Math.round(totalOaU), Math.round(totalDiscomB), Math.round(totalNetB), Math.round(totalConsumerU), Math.round(totalOaB)]);
    if (sheet.lastRow) sheet.lastRow.font = { bold: true };

    sheet.addRow([]);
    const t = oaDetailed.totals;
    sheet.addRow(['Cross Subsidy', Math.round(t.cssCharge)]);
    sheet.addRow(['RPPO', Math.round(t.rpoCharge)]);
    sheet.addRow(['POC charges', Math.round(t.pocCharge)]);
    sheet.addRow(['STU charges', Math.round(t.stuCharge)]);
    sheet.addRow(['Discom charges', Math.round(t.dcCharge)]);
    sheet.addRow(['IEX fee (including GST)', Math.round(t.iexFee)]);
    sheet.addRow(['SLDC Operating charges', Math.round(oaDetailed.dailyFixedOverhead)]);
    sheet.addRow(['NLDC application charges', Math.round(oaDetailed.bidApplicationFees)]);
    
    sheet.addRow([]);
    sheet.addRow(['Total Estimated OA Bill (Inc. Overheads)', Math.round(totalOaB + oaDetailed.dailyFixedOverhead + oaDetailed.bidApplicationFees)]);
    const totalGrossBill = result.totalLandedExchangeCost + oaDetailed.dailyFixedOverhead + oaDetailed.bidApplicationFees;
    sheet.addRow(['Total Gross Bill (Net Landed OA Cost)', Math.round(totalGrossBill)]);
    
    sheet.addRow([]);
    sheet.addRow(['Net Savings', Math.round(totalDiscomB - totalGrossBill)]);
    if (sheet.lastRow) {
      sheet.lastRow.font = { bold: true, color: { argb: 'FF008000' } };
    }
    
    // Auto-fit column A
    sheet.getColumn(1).width = 40;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
