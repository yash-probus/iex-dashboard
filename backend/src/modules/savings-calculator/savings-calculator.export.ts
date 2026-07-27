import * as ExcelJS from 'exceljs';
import { SavingsCalculatorService } from './savings-calculator.service';

export class SavingsCalculatorExportService {
  private static async addSavingsSheet(workbook: ExcelJS.Workbook, monthName: string, result: any, entry: any) {
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
      headerRow2.push('Qty (MWh)', 'Rate (Rs/kWh)', 'Market');
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
    hr1.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } });
    
    hr2.font = { bold: true };
    hr2.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } });

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
          row.push(Number(((slot.marketEnergy || 0) / 1000).toFixed(4)));
          row.push(Number(mcp.toFixed(2)));
          row.push(slot.marketSource || '-');
        } else {
          row.push('-', '-', '-');
        }
      });
      sheet.addRow(row);
    }



    // Add Total Quantity Row
    const totalRow: any[] = ['Total Quantity (MWh)'];
    days.forEach(day => {
      let dayTotal = 0;
      slotsData.filter((s: any) => s.date === day && s.shouldBuyFromMarket).forEach((s: any) => {
        dayTotal += (s.marketEnergy || 0);
      });
      totalRow.push(Number((dayTotal / 1000).toFixed(4)), '-', '-');
    });
    const tr = sheet.addRow(totalRow);
    tr.font = { bold: true };
    tr.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } });

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
    
    const isNpcl = result.discom === 'NPCL';
    
    let energyCharges = (result.totalBaselineCost || 0) - (result.demandCharge || 0) - (result.electricityDuty || 0);
    let demandCharges = result.demandCharge || 0;
    const ed = result.electricityDuty || 0;
    const arrear = result.arrearAmount || 0;
    const lpsc = result.currentLpsc || 0;
    
    if (isNpcl) {
      const npclMultiplier = 0.90 * 0.99;
      const grossEnergy = energyCharges / npclMultiplier;
      const grossDemand = demandCharges / npclMultiplier;
      
      const energyRebate10 = grossEnergy * 0.10;
      const energyRebate1 = (grossEnergy - energyRebate10) * 0.01;
      const demandRebate10 = grossDemand * 0.10;
      const demandRebate1 = (grossDemand - demandRebate10) * 0.01;
      
      sheet.addRow(['Gross Energy Charges', Math.round(grossEnergy)]);
      sheet.addRow(['Gross Demand & Fixed Charges', Math.round(grossDemand)]);
      sheet.addRow(['NPCL Rebate (10%)', -Math.round(energyRebate10 + demandRebate10)]);
      sheet.addRow(['NPCL Prompt Payment Rebate (1%)', -Math.round(energyRebate1 + demandRebate1)]);
      sheet.addRow(['Net Energy & Demand Charges', Math.round(energyCharges + demandCharges)]);
    } else {
      sheet.addRow(['Energy Charges', Math.round(energyCharges)]);
      sheet.addRow(['Demand & Fixed Charges', Math.round(demandCharges)]);
    }
    
    sheet.addRow(['Electricity Duty', Math.round(ed)]);
    if (arrear > 0) sheet.addRow(['Arrear Amount', Math.round(arrear)]);
    if (lpsc > 0) sheet.addRow(['Current LPSC', Math.round(lpsc)]);
    const totalBaselineWithMisc = (result.totalBaselineCost || 0) + arrear + lpsc;
    sheet.addRow(['Total DISCOM Baseline Bill', Math.round(totalBaselineWithMisc)]);
    if (sheet.lastRow) sheet.lastRow.font = { bold: true };

    sheet.addRow([]);

    // --- NEW: DISCOM Bill After Open Access Breakdown ---
    sheet.addRow(['DISCOM Bill After Open Access Breakdown']);
    if (sheet.lastRow) sheet.lastRow.font = { bold: true };
    
    let energyChargesAfterOA = (result.totalDiscomAfterProlt || 0) - (result.demandCharge || 0) - (result.electricityDuty || 0);
    
    if (isNpcl) {
      const npclMultiplier = 0.90 * 0.99;
      const grossEnergyAfterOA = energyChargesAfterOA / npclMultiplier;
      const grossDemand = demandCharges / npclMultiplier;
      
      const energyRebate10AfterOA = grossEnergyAfterOA * 0.10;
      const energyRebate1AfterOA = (grossEnergyAfterOA - energyRebate10AfterOA) * 0.01;
      const demandRebate10 = grossDemand * 0.10;
      const demandRebate1 = (grossDemand - demandRebate10) * 0.01;
      
      sheet.addRow(['Gross Energy Charges', Math.round(grossEnergyAfterOA)]);
      sheet.addRow(['Gross Demand & Fixed Charges', Math.round(grossDemand)]);
      sheet.addRow(['NPCL Rebate (10%)', -Math.round(energyRebate10AfterOA + demandRebate10)]);
      sheet.addRow(['NPCL Prompt Payment Rebate (1%)', -Math.round(energyRebate1AfterOA + demandRebate1)]);
      sheet.addRow(['Net Energy & Demand Charges', Math.round(energyChargesAfterOA + demandCharges)]);
    } else {
      sheet.addRow(['Energy Charges', Math.round(energyChargesAfterOA)]);
      sheet.addRow(['Demand & Fixed Charges', Math.round(demandCharges)]);
    }
    
    sheet.addRow(['Electricity Duty', Math.round(ed)]);
    if (arrear > 0) sheet.addRow(['Arrear Amount', Math.round(arrear)]);
    if (lpsc > 0) sheet.addRow(['Current LPSC', Math.round(lpsc)]);
    const totalDiscomAfterOAWithMisc = (result.totalDiscomAfterProlt || 0) + arrear + lpsc;
    sheet.addRow(['Total DISCOM Bill After Open Access', Math.round(totalDiscomAfterOAWithMisc)]);
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
    
    const totalMarketEnergyCost = todSummaries.reduce((sum: number, s: any) => sum + (s.marketCostBase || 0), 0);
    const avgMarketPrice = totalMarketEnergy > 0 ? totalMarketEnergyCost / totalMarketEnergy : 0;
    
    const istsBasis = totalMarketEnergy;
    const istsLostUnits = istsBasis * (istsLoss / 100);
    const istsLossAmount = istsLostUnits * avgMarketPrice;
    
    const stuBasis = istsBasis - istsLostUnits;
    const stuLostUnits = stuBasis * (stuLoss / 100);
    const stuLossAmount = stuLostUnits * avgMarketPrice;
    
    const wheelingBasis = stuBasis - stuLostUnits;
    const wheelingLostUnits = wheelingBasis * (wheelingLoss / 100);
    const wheelingLossAmount = wheelingLostUnits * avgMarketPrice;

    addChargeRow('ISTS Loss', istsLossAmount, avgMarketPrice, istsBasis, istsLoss);
    addChargeRow('STU Loss', stuLossAmount, avgMarketPrice, stuBasis, stuLoss);
    addChargeRow('Wheeling Loss', wheelingLossAmount, avgMarketPrice, wheelingBasis, wheelingLoss);

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
    sheet.addRow(['SLDC Operating charges - Total', Math.round(sldcCost), '-', `${tradedDays.DAM.size + tradedDays.GDAM.size + tradedDays.RTM.size} markets`, '-']);
    
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
    
    sheet.addRow(['DISCOM Bill Before PROLT', Math.round(totalDiscomB + (result.arrearAmount || 0) + (result.currentLpsc || 0))]);
    const discomAfterProltWithMisc = (result.totalDiscomAfterProlt || 0) + (result.arrearAmount || 0) + (result.currentLpsc || 0);
    sheet.addRow(['DISCOM Bill After PROLT', Math.round(discomAfterProltWithMisc)]);
    
    sheet.addRow(['Net Savings', Math.round(netSavings)]);
    
    const nocFee = 7000;
    const regFee = 8333;
    const consultancyFeeVal = entry.consultancyFee !== null && entry.consultancyFee !== undefined ? Number(entry.consultancyFee) : 20000;
    const platformFeeRate = entry.probusPlatformFee !== null && entry.probusPlatformFee !== undefined ? Number(entry.probusPlatformFee) : 0.02;
    const probusPlatformFee = Math.round(result.totalMarketEnergyKwh * platformFeeRate);
    const proltMarginVal = (t as any).proltMarginCost || 0;

    sheet.addRow(['Monthly NOC Fee', nocFee]);
    sheet.addRow(['IEX Registration Fee', regFee]);
    sheet.addRow(['Consultancy Fee', consultancyFeeVal]);
    sheet.addRow(['Platform Fee', probusPlatformFee]);
    sheet.addRow(['Trader Margin', Math.round(proltMarginVal)]);
    
    const finalSavings = netSavings - nocFee - regFee - consultancyFeeVal - probusPlatformFee - proltMarginVal;
    sheet.addRow(['Final Client Savings', Math.round(finalSavings)]);
    
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
      const allResults = [];
      
      for (const m of months) {
        const result = await SavingsCalculatorService.calculateMarketDecision(id, m, version);
        allResults.push({ monthStr: m, result });
      }
      
      if (allResults.length > 0) {
        await SavingsCalculatorExportService.addSummarySheet(workbook, entry, allResults);
      }
      
      for (const r of allResults) {
        const sheetName = r.monthStr ? new Date(`${r.monthStr}-01`).toLocaleString('default', { month: 'short', year: 'numeric' }) : 'Savings Analysis';
        await SavingsCalculatorExportService.addSavingsSheet(workbook, sheetName, r.result, entry);
      }
    } else {
      const entry = await SavingsCalculatorService.getEntryOrVersion(id, version);
      const result = await SavingsCalculatorService.calculateMarketDecision(id, monthStr, version);
      const sheetName = monthStr ? new Date(`${monthStr}-01`).toLocaleString('default', { month: 'short', year: 'numeric' }) : 'Savings Analysis';
      await SavingsCalculatorExportService.addSavingsSheet(workbook, sheetName, result, entry);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private static async addSummarySheet(workbook: ExcelJS.Workbook, entry: any, allResults: any[]) {
    const sheet = workbook.addWorksheet('Summary');
    
    // Header
    sheet.addRow([`Industry Name: ${entry.industryName || entry.clientName || ''}`]);
    sheet.addRow([`Location / Address: ${entry.address || ''}`]);
    sheet.addRow([`Connectivity: ${entry.voltageLevel || ''}`]);
    
    // Make headers bold
    for (let i = 1; i <= 3; i++) {
      if (sheet.getCell(`A${i}`)) sheet.getCell(`A${i}`).font = { bold: true };
    }
    sheet.addRow([]);

    // Sort results chronologically
    allResults.sort((a, b) => a.monthStr.localeCompare(b.monthStr));

    const monthHeaders = allResults.map(r => {
      const date = new Date(`${r.monthStr}-01`);
      return date.toLocaleString('default', { month: 'short', year: '2-digit' }).replace(' ', '-');
    });

    const numMonths = allResults.length;

    // Calculation Base
    const calcBaseRow = sheet.addRow(['Calculation Base:', 'Demand (MW)', ...Array(numMonths).fill('')]);
    calcBaseRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } };
    calcBaseRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } };
    calcBaseRow.getCell(1).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    calcBaseRow.getCell(2).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    
    sheet.addRow([]);

    // TOD Header
    const todHeaderRow = sheet.addRow(['TOD', ...monthHeaders]);
    todHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    todHeaderRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } });
    
    const uniqueTods = new Set<string>();
    allResults.forEach(r => {
      r.result.todSummaries.forEach((t: any) => uniqueTods.add(t.slabName));
    });
    const todSlabs = Array.from(uniqueTods).sort();

    const demandMw = (entry.sanctionedLoadKw ? Number(entry.sanctionedLoadKw) : 0) / 1000;
    
    todSlabs.forEach(tod => {
      sheet.addRow([tod, ...Array(numMonths).fill(demandMw)]);
    });

    sheet.addRow([]);

    // Savings section
    const savingsHeaderRow = sheet.addRow(['Savings', ...monthHeaders]);
    savingsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    savingsHeaderRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } });

    todSlabs.forEach(tod => {
      const todUnits = allResults.map(r => {
        const found = r.result.todSummaries.find((t: any) => t.slabName === tod);
        return found ? Math.round(found.marketEnergyKwh) : 0;
      });
      sheet.addRow([`Cleared Units@Consumer bus ${tod}`, ...todUnits]);
    });

    const totalClearedUnits = allResults.map(r => Math.round(r.result.totalMarketEnergyKwh));
    const totalClearedRow = sheet.addRow(['Total Cleared Units@Consumer bus', ...totalClearedUnits]);
    totalClearedRow.font = { bold: true };

    const totalConsumption = allResults.map(r => Math.round(r.result.totalEnergyKwh));
    const totalConsumptionRow = sheet.addRow(['Total Consumption As per Ebill', ...totalConsumption]);
    totalConsumptionRow.font = { bold: true };

    const clearedVsActual = allResults.map((r, i) => totalConsumption[i] > 0 ? (totalClearedUnits[i] / totalConsumption[i]) : 0);
    const clearedVsActualRow = sheet.addRow(['Cleared vs Actual consumption %', ...clearedVsActual]);
    for (let i = 2; i <= numMonths + 1; i++) clearedVsActualRow.getCell(i).numFmt = '0%';

    const totalPowerCostOA = allResults.map(r => Math.round(r.result.totalLandedExchangeCost + r.result.oaDetailed.dailyFixedOverhead + r.result.oaDetailed.bidApplicationFees));
    const totalPowerCostOARow = sheet.addRow(['Total Power Cost through Open Access', ...totalPowerCostOA]);
    totalPowerCostOARow.font = { bold: true };

    const discomCost = allResults.map(r => Math.round(r.result.totalBaselineCost));
    const discomCostRow = sheet.addRow(['Discom Cost', ...discomCost]);
    discomCostRow.font = { bold: true };

    sheet.addRow([]);

    const ppcDiscom = allResults.map((r, i) => totalClearedUnits[i] > 0 ? (discomCost[i] / totalClearedUnits[i]) : 0);
    const ppcDiscomRow = sheet.addRow(['Power Purchase Cost (Discom Only)', ...ppcDiscom]);
    ppcDiscomRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } });
    ppcDiscomRow.font = { bold: true };
    for (let i = 2; i <= numMonths + 1; i++) ppcDiscomRow.getCell(i).numFmt = '₹0.00';

    const ppcProlt = allResults.map((r, i) => totalClearedUnits[i] > 0 ? (totalPowerCostOA[i] / totalClearedUnits[i]) : 0);
    const ppcProltRow = sheet.addRow(['Power Purchase Cost (With Prolt)', ...ppcProlt]);
    ppcProltRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } });
    ppcProltRow.font = { bold: true };
    for (let i = 2; i <= numMonths + 1; i++) ppcProltRow.getCell(i).numFmt = '₹0.00';

    // Total Saving = Gross Saving (Discom - Power Cost OA)
    const totalSaving = allResults.map((r, i) => discomCost[i] - totalPowerCostOA[i]);
    const totalSavingRow = sheet.addRow(['Total Saving', ...totalSaving]);
    totalSavingRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } });
    totalSavingRow.font = { bold: true };

    const savingUnit = allResults.map((r, i) => totalClearedUnits[i] > 0 ? (totalSaving[i] / totalClearedUnits[i]) : 0);
    const savingUnitRow = sheet.addRow(['Saving/Unit', ...savingUnit]);
    savingUnitRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } });
    savingUnitRow.font = { bold: true };
    for (let i = 2; i <= numMonths + 1; i++) savingUnitRow.getCell(i).numFmt = '₹0.00';

    const consultancyFeeVal = entry.consultancyFee !== null && entry.consultancyFee !== undefined ? Number(entry.consultancyFee) : 20000;
    sheet.addRow(['Monthly NOC Fee', ...Array(numMonths).fill(7000)]);
    sheet.addRow(['IEX Registration Fee', ...Array(numMonths).fill(8333)]);
    sheet.addRow(['Consultancy Fee', ...Array(numMonths).fill(consultancyFeeVal)]);

    sheet.addRow([]);

    const probusHeaderRow = sheet.addRow(['Margin Details', ...monthHeaders]);
    probusHeaderRow.font = { bold: true };
    probusHeaderRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } });

    const probusTradingMargin = allResults.map(r => Math.round(r.result.oaDetailed.totals.traderMargin));
    sheet.addRow([`Trader Margin (Rs ${entry.traderMargin !== null && entry.traderMargin !== undefined ? entry.traderMargin : 0.02}/kWh)`, ...probusTradingMargin]);

    const platformFeeRate = entry.probusPlatformFee !== null && entry.probusPlatformFee !== undefined ? Number(entry.probusPlatformFee) : 0.02;
    const probusPlatformFee = allResults.map(r => Math.round(r.result.totalMarketEnergyKwh * platformFeeRate));
    sheet.addRow([`Platform Fee (Rs ${platformFeeRate}/kWh)`, ...probusPlatformFee]);

    const probusValueShare = allResults.map(r => Math.round(r.result.oaDetailed.totals.proltMarginCost));
    sheet.addRow(['Probus Value-Share for Prolt Energy Platform (15% of Saving)', ...probusValueShare]);

    const totalAmount = allResults.map((r, i) => probusTradingMargin[i] + probusPlatformFee[i] + probusValueShare[i]);
    const totalAmountRow = sheet.addRow(['Total Amount', ...totalAmount]);
    totalAmountRow.font = { bold: true };
    totalAmountRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } });

    const probusRevUnit = allResults.map((r, i) => totalClearedUnits[i] > 0 ? (totalAmount[i] / totalClearedUnits[i]) : 0);
    const probusRevUnitRow = sheet.addRow(['Probus Revenue /Unit', ...probusRevUnit]);
    for (let i = 2; i <= numMonths + 1; i++) probusRevUnitRow.getCell(i).numFmt = '0.00';

    sheet.addRow([]);

    const nocFee = 7000;
    const regFee = 8333;
    // We only deduct Platform Fee, Value Share, NOC, Reg, and Consultancy.
    // Trading Margin is already deducted inside totalPowerCostOA, so we do not deduct it again!
    const savingForBiz = allResults.map((r, i) => totalSaving[i] - nocFee - regFee - consultancyFeeVal - probusPlatformFee[i] - probusValueShare[i]);
    const savingForBizRow = sheet.addRow(['Saving for your business', ...savingForBiz]);
    savingForBizRow.font = { bold: true };
    savingForBizRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } });

    const savingForBizUnit = allResults.map((r, i) => totalClearedUnits[i] > 0 ? (savingForBiz[i] / totalClearedUnits[i]) : 0);
    const savingForBizUnitRow = sheet.addRow(['Saving/Unit', ...savingForBizUnit]);
    savingForBizUnitRow.font = { bold: true };
    savingForBizUnitRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } });
    for (let i = 2; i <= numMonths + 1; i++) savingForBizUnitRow.getCell(i).numFmt = '₹0.00';

    sheet.addRow([]);

    const savingForBizSum = savingForBiz.reduce((sum, val) => sum + val, 0);
    const avgMonthlySavingRow = sheet.addRow(['Average Monthly Saving', Math.round(savingForBizSum / numMonths)]);
    avgMonthlySavingRow.font = { bold: true };
    avgMonthlySavingRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
    avgMonthlySavingRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };

    const avgAnnualSavingRow = sheet.addRow(['Average Annual Saving', Math.round(savingForBizSum / numMonths) * 12]);
    avgAnnualSavingRow.font = { bold: true };
    avgAnnualSavingRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
    avgAnnualSavingRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };

    // Set column width for A
    sheet.getColumn(1).width = 50;

    // Add borders to all populated cells
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.value !== null && cell.value !== '') {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      });
    });
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
    hr1.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } });
    
    hr2.font = { bold: true };
    hr2.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } });

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
