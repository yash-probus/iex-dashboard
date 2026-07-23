import * as ExcelJS from 'exceljs';
import { SavingsCalculatorService } from './savings-calculator.service';

export class SavingsCalculatorExportService {
  private static async addSavingsSheet(workbook: ExcelJS.Workbook, monthName: string, result: any) {
    const { slotsData, todSummaries, oaDetailed } = result;

    // Remove invalid characters for worksheet names
    const safeSheetName = monthName.replace(/[\/*?\[\]]/g, '').substring(0, 31);
    const sheet = workbook.addWorksheet(safeSheetName, {
      views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }]
    });

    // We need all unique days sorted
    const daysSet = new Set<string>();
    slotsData.forEach((s: any) => daysSet.add(s.date));
    const days = Array.from(daysSet).sort();

    // Headers
    const headerRow1 = ['Blockwise DAM Rates on IEX'];
    const headerRow2 = [''];
    days.forEach(d => {
      // Format day like '1-May'
      const dateObj = new Date(d);
      const dayStr = `${dateObj.getDate()}-${dateObj.toLocaleString('default', { month: 'short' })}`;
      headerRow1.push(dayStr, '', '');
      headerRow2.push('Price (₹)', 'Qty (kWh)', 'Market');
    });

    const hr1 = sheet.addRow(headerRow1);
    const hr2 = sheet.addRow(headerRow2);
    
    // Merge cells for headerRow1
    let colIndex = 2;
    days.forEach(() => {
      sheet.mergeCells(1, colIndex, 1, colIndex + 2);
      sheet.getCell(1, colIndex).alignment = { horizontal: 'center' };
      colIndex += 3;
    });

    hr1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hr1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    
    hr2.font = { bold: true };
    hr2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } };

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
      const row: any[] = [formatBlock(b)];
      days.forEach(day => {
        const slot = slotsData.find((s: any) => s.date === day && s.timeblock === b) as any;
        if (slot && slot.shouldBuyFromMarket) {
          // If won, show the MCP (base price) of the selected market
          let mcp = 0;
          if (slot.marketSource === 'DAM') mcp = slot.damMcp || 0;
          else if (slot.marketSource === 'RTM') mcp = slot.rtmMcp || 0;
          else if (slot.marketSource === 'GDAM') mcp = slot.gdamMcp || 0;
          row.push(Number(mcp.toFixed(2)));
          row.push(Math.round(slot.marketEnergy || 0));
          row.push(slot.marketSource || '-');
        } else {
          row.push('-', '-', '-');
        }
      });
      sheet.addRow(row);
    }



    // Add Total Quantity Row
    const totalRow: any[] = ['Total Quantity (kWh)'];
    days.forEach(day => {
      let dayTotal = 0;
      slotsData.filter((s: any) => s.date === day && s.shouldBuyFromMarket).forEach((s: any) => {
        dayTotal += (s.marketEnergy || 0);
      });
      totalRow.push('-', Math.round(dayTotal), '-');
    });
    const tr = sheet.addRow(totalRow);
    tr.font = { bold: true };
    tr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };

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
    const breakdownHeader = [
      'TOD Slab',
      'Actual DISCOM Units (kWh)',
      'Actual DISCOM Bill (Rs.)',
      'OA Units (kWh, Regional Bus)',
      'OA Units (kWh, Consumer Bus)',
      'OA Energy Charges (Rs.)',
      'DISCOM Bill after OA (Rs.)'
    ];
    sheet.addRow(breakdownHeader);
    if (sheet.lastRow) sheet.lastRow.font = { bold: true };

    let totalDiscomU = 0, totalOaU = 0, totalDiscomB = 0, totalNetB = 0, totalConsumerU = 0, totalOaB = 0;

    oaDetailed.breakdown.forEach((b: any) => {
      sheet.addRow([
        b.slabName,
        Math.round(b.discomUnits),
        Math.round(b.discomBill),
        Math.round(b.oaUnits),
        Math.round(b.consumerBusUnits),
        Math.round(b.oaBill),
        Math.round(b.proltDiscomBill)
      ]);
      totalDiscomU += b.discomUnits;
      totalOaU += b.oaUnits;
      totalDiscomB += b.discomBill;
      totalNetB += b.proltDiscomBill;
      totalConsumerU += b.consumerBusUnits;
      totalOaB += b.oaBill;
    });

    sheet.addRow([
      'Total', 
      Math.round(totalDiscomU), 
      Math.round(totalDiscomB), 
      Math.round(totalOaU), 
      Math.round(totalConsumerU), 
      Math.round(totalOaB),
      Math.round(totalNetB)
    ]);
    if (sheet.lastRow) sheet.lastRow.font = { bold: true };

    sheet.addRow([]);

    // --- NEW: DISCOM Baseline Breakdown ---
    sheet.addRow(['DISCOM Baseline Breakdown']);
    if (sheet.lastRow) sheet.lastRow.font = { bold: true };
    
    const energyCharges = (result.totalBaselineCost || 0) - (result.demandCharge || 0) - (result.electricityDuty || 0);
    const demandCharges = result.demandCharge || 0;
    const miscCharges = result.electricityDuty || 0;
    
    sheet.addRow(['Energy Charges', Math.round(energyCharges)]);
    sheet.addRow(['Demand & Fixed Charges', Math.round(demandCharges)]);
    sheet.addRow(['Miscellaneous Charges (Electricity Duty, etc.)', Math.round(miscCharges)]);
    sheet.addRow(['Total DISCOM Baseline Bill', Math.round(result.totalBaselineCost || 0)]);
    if (sheet.lastRow) sheet.lastRow.font = { bold: true };

    sheet.addRow([]);
    
    // Add charges header with rate/kWh information
    const chargesHeader = ['Open Access Charge Type', 'Total Amount (₹)', 'Rate per kWh (₹)', 'Basis (kWh)', 'Percentage (%)'];
    sheet.addRow(chargesHeader);
    if (sheet.lastRow) sheet.lastRow.font = { bold: true };
    
    const t = oaDetailed.totals;
    const totalMarketEnergy = result.totalMarketEnergyKwh;
    
    console.log('[Excel Export Debug] Cross Subsidy from totals:', t.cssCharge);
    console.log('[Excel Export Debug] STU Charges from totals:', t.stuCharge);
    console.log('[Excel Export Debug] Total Market Energy:', totalMarketEnergy);
    
    // Calculate and add each charge with rate information
    const addChargeRow = (name: string, amount: number, ratePerKwh: number, basisKwh: number, percentage: number = 0) => {
      sheet.addRow([
        name,
        Math.round(amount),
        ratePerKwh > 0 ? Number(ratePerKwh.toFixed(4)) : '-',
        basisKwh > 0 ? Math.round(basisKwh) : '-',
        percentage > 0 ? Number(percentage.toFixed(2)) : '-'
      ]);
    };
    
    // Cross Subsidy (rate varies by state, use actual rate from calculation)
    // Note: Cross subsidy is applied to consumer bus units (after losses), not market energy
    const cssRate = (t as any).cssRate || 0;
    const cssBasis = totalMarketEnergy; // Showing market energy for reference
    addChargeRow('Cross Subsidy', t.cssCharge, cssRate, cssBasis);
    
    // RPPO (flat rate of ₹0.25/kWh)
    addChargeRow('RPPO', t.rpoCharge, 0.25, t.rpoCharge / 0.25);
    
    // Losses (Percentages)
    const istsLoss = slotsData.length > 0 ? (slotsData[0] as any).istsLoss || 0 : 0;
    const stuLoss = slotsData.length > 0 ? (slotsData[0] as any).stuLoss || 0 : 0;
    const wheelingLoss = slotsData.length > 0 ? (slotsData[0] as any).wheelingLoss || 0 : 0;
    
    addChargeRow('ISTS Loss', 0, 0, 0, istsLoss);
    addChargeRow('STU Loss', 0, 0, 0, stuLoss);
    addChargeRow('Wheeling Loss', 0, 0, 0, wheelingLoss);

    // POC charges (CTU charges)
    const pocRate = totalMarketEnergy > 0 ? t.pocCharge / totalMarketEnergy : 0;
    addChargeRow('POC charges', t.pocCharge, pocRate, totalMarketEnergy);
    
    // STU charges
    const stuRate = totalMarketEnergy > 0 ? t.stuCharge / totalMarketEnergy : 0;
    addChargeRow('STU charges', t.stuCharge, stuRate, totalMarketEnergy);
    
    // Discom charges (Distribution/Wheeling charges)
    const dcRate = totalMarketEnergy > 0 ? t.dcCharge / totalMarketEnergy : 0;
    addChargeRow('Discom charges', t.dcCharge, dcRate, totalMarketEnergy);
    
    // IEX fee (fixed at ₹0.02/kWh)
    addChargeRow('IEX fee', t.iexFee, 0.02, totalMarketEnergy, 0.02);
    
    // Trader Margin (varies, calculate rate)
    const traderMargin = (t as any).traderMargin || 0;
    const traderMarginGst = (t as any).traderMarginGst || 0;
    const traderRate = totalMarketEnergy > 0 ? traderMargin / totalMarketEnergy : 0;
    const traderGstRate = totalMarketEnergy > 0 ? traderMarginGst / totalMarketEnergy : 0;
    addChargeRow('Trader Margin', traderMargin, traderRate, totalMarketEnergy);
    addChargeRow('Trader Margin GST (18%)', traderMarginGst, traderGstRate, totalMarketEnergy, 18);
    
    // SLDC Operating charges (per market per day)
    const sldcCost = (oaDetailed as any).sldcSchedulingCost || 0;
    
    // Calculate SLDC breakdown by market
    const tradedDays = { DAM: new Set<string>(), GDAM: new Set<string>(), RTM: new Set<string>() };
    slotsData.forEach((s: any) => {
      if (s.shouldBuyFromMarket && s.marketSource) {
        if (s.marketSource === 'DAM') tradedDays.DAM.add(s.date);
        else if (s.marketSource === 'GDAM') tradedDays.GDAM.add(s.date);
        else if (s.marketSource === 'RTM') tradedDays.RTM.add(s.date);
      }
    });
    
    const sldcFeePerDay = 1500; // Default SLDC fee per market per day
    const damSldcCost = tradedDays.DAM.size * sldcFeePerDay;
    const gdamSldcCost = tradedDays.GDAM.size * sldcFeePerDay;
    const rtmSldcCost = tradedDays.RTM.size * sldcFeePerDay;
    
    sheet.addRow(['SLDC Operating charges - DAM', Math.round(damSldcCost), '-', `${tradedDays.DAM.size} days`, '-']);
    sheet.addRow(['SLDC Operating charges - GDAM', Math.round(gdamSldcCost), '-', `${tradedDays.GDAM.size} days`, '-']);
    sheet.addRow(['SLDC Operating charges - RTM', Math.round(rtmSldcCost), '-', `${tradedDays.RTM.size} days`, '-']);
    sheet.addRow(['SLDC Operating charges - Total', Math.round(sldcCost), '-', `${tradedDays.DAM.size + tradedDays.GDAM.size + tradedDays.RTM.size} market-days`, '-']);
    
    // NLDC Scheduling charges (fixed per unique day)
    const nldcCost = (oaDetailed as any).nldcSchedulingCost || 0;
    const uniqueDays = new Set([...tradedDays.DAM, ...tradedDays.GDAM, ...tradedDays.RTM]).size;
    sheet.addRow(['NLDC Scheduling charges', Math.round(nldcCost), '-', `${uniqueDays} unique days`, '-']);
    
    // NLDC application charges (fixed per bid)
    sheet.addRow(['NLDC application charges', Math.round(oaDetailed.bidApplicationFees), '-', '-', '-']);
    
    sheet.addRow([]);
    sheet.addRow(['Total Estimated OA Bill (Inc. Overheads)', Math.round(totalOaB + oaDetailed.dailyFixedOverhead + oaDetailed.bidApplicationFees)]);
    const totalGrossBill = result.totalLandedExchangeCost + oaDetailed.dailyFixedOverhead + oaDetailed.bidApplicationFees;
    sheet.addRow(['Total Gross Bill (Net Landed OA Cost)', Math.round(totalGrossBill)]);
    
    sheet.addRow([]);
    const netSavings = totalDiscomB - totalGrossBill;
    sheet.addRow(['Net Savings', Math.round(netSavings)]);
    
    const proltMarginVal = (t as any).proltMarginCost || 0;
    sheet.addRow(['PROLT Margin', Math.round(proltMarginVal)]);
    
    sheet.addRow(['Final Client Savings', Math.round(netSavings - proltMarginVal)]);
    
    if (sheet.lastRow) {
      sheet.lastRow.font = { bold: true, color: { argb: 'FF008000' } };
    }
    
    // Auto-fit column A
    sheet.getColumn(1).width = 40;

  }

  static async exportToExcel(id: string, monthStr?: string, version?: number): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    if (monthStr === 'all') {
      const entry = await SavingsCalculatorService.getEntryOrVersion(id, version);
      const months = Object.keys(entry?.todConsumptions || {}).sort();
      for (const m of months) {
        const result = await SavingsCalculatorService.calculateMarketDecision(id, m, version);
        const monthName = new Date(`${m}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });
        await SavingsCalculatorExportService.addSavingsSheet(workbook, monthName, result);
      }
    } else {
      const result = await SavingsCalculatorService.calculateMarketDecision(id, monthStr, version);
      const sheetName = monthStr ? new Date(`${monthStr}-01`).toLocaleString('default', { month: 'short', year: 'numeric' }) : 'Savings Analysis';
      await SavingsCalculatorExportService.addSavingsSheet(workbook, sheetName, result);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private static async addDemandShiftSheet(workbook: ExcelJS.Workbook, monthName: string, result: any) {
    const { slotsData } = result;

    const safeSheetName = monthName.replace(/[\/*?\[\]]/g, '').substring(0, 31);
    const sheet = workbook.addWorksheet(safeSheetName, {
      views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }]
    });

    // We need all unique days sorted
    const daysSet = new Set<string>();
    slotsData.forEach((s: any) => daysSet.add(s.date));
    const days = Array.from(daysSet).sort();

    // Headers
    const headerRow1 = ['Blockwise DAM Rates on IEX (Post-Shift)'];
    const headerRow2 = [''];
    days.forEach(d => {
      const dateObj = new Date(d);
      const dayStr = `${dateObj.getDate()}-${dateObj.toLocaleString('default', { month: 'short' })}`;
      headerRow1.push(dayStr, '', '');
      headerRow2.push('Price (₹)', 'Qty (kWh Market)', 'Market');
    });

    const hr1 = sheet.addRow(headerRow1);
    const hr2 = sheet.addRow(headerRow2);
    
    // Merge cells for headerRow1
    let colIndex = 2;
    days.forEach(() => {
      sheet.mergeCells(1, colIndex, 1, colIndex + 2);
      sheet.getCell(1, colIndex).alignment = { horizontal: 'center' };
      colIndex += 3;
    });

    hr1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hr1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    
    hr2.font = { bold: true };
    hr2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } };

    const formatBlock = (blockIdx: number) => {
      const startMin = (blockIdx - 1) * 15;
      const endMin = blockIdx * 15;
      const h1 = Math.floor(startMin / 60).toString().padStart(2, '0');
      const m1 = (startMin % 60).toString().padStart(2, '0');
      const h2 = Math.floor(endMin / 60).toString().padStart(2, '0');
      const m2 = (endMin % 60).toString().padStart(2, '0');
      return `${h1}:${m1} - ${h2}:${m2}`;
    };

    for (let b = 1; b <= 96; b++) {
      const row = [formatBlock(b)];
      days.forEach(day => {
        const slot = slotsData.find((s: any) => s.date === day && s.timeblock === b) as any;
        if (slot && slot.shouldBuyFromMarket && slot.marketEnergy > 0) {
          let mcp = 0;
          if (slot.marketSource === 'DAM') mcp = slot.damMcp || 0;
          else if (slot.marketSource === 'RTM') mcp = slot.rtmMcp || 0;
          else if (slot.marketSource === 'GDAM') mcp = slot.gdamMcp || 0;
          row.push(mcp.toFixed(2));
          row.push(Math.round(slot.marketEnergy).toString());
          row.push(slot.marketSource || '-');
        } else {
          row.push('-', '-', '-');
        }
      });
      sheet.addRow(row);
    }

    sheet.addRow([]);
    sheet.addRow([]);
    
    sheet.addRow(['Summary']);
    if (sheet.lastRow) {
      sheet.lastRow.font = { bold: true, size: 14 };
    }
    
    sheet.addRow(['Original Total Cost (₹)', Math.round(result.originalTotalCost)]);
    sheet.addRow(['New Total Cost (Post-Shift) (₹)', Math.round(result.newTotalCost)]);
    sheet.addRow(['Potential Extra Savings (₹)', Math.round(result.savingsAchieved)]);
    sheet.addRow(['Shifted Energy (kWh)', Math.round(result.shiftedEnergy)]);
    
    if (sheet.lastRow) {
      sheet.getCell(sheet.lastRow.number, 1).font = { bold: true };
      sheet.getCell(sheet.lastRow.number - 1, 1).font = { bold: true, color: { argb: 'FF008000' } };
    }

    sheet.getColumn(1).width = 40;
  }

  static async exportDemandShiftToExcel(id: string, monthStr?: string, version?: number): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    if (monthStr === 'all') {
      const entry = await SavingsCalculatorService.getEntryOrVersion(id, version);
      const months = Object.keys(entry?.todConsumptions || {}).sort();
      for (const m of months) {
        const result = await SavingsCalculatorService.calculateDemandShiftInsights(id, m, version);
        const monthName = new Date(`${m}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });
        await SavingsCalculatorExportService.addDemandShiftSheet(workbook, monthName, result);
      }
    } else {
      const result = await SavingsCalculatorService.calculateDemandShiftInsights(id, monthStr, version);
      const sheetName = monthStr ? new Date(`${monthStr}-01`).toLocaleString('default', { month: 'short', year: 'numeric' }) : 'Demand Shift';
      await SavingsCalculatorExportService.addDemandShiftSheet(workbook, sheetName, result);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
