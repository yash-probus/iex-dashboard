import prisma from '../../config/prisma';
import { getCache, setCache, invalidateCache } from '../../config/redis';

export interface CustomTodSlot {
  id?: string;
  name?: string;
  startTime: string; // "HH:MM" e.g. "05:00"
  endTime: string;   // "HH:MM" e.g. "08:00"
  consumptionKwh: number;
  effectivePrice: number; // Discom exact price in Rs/kWh
}

export class SavingsCalculatorNewService {
  static async getAll() {
    return (prisma as any).savingsCalculatorNewEntry.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getById(id: string) {
    return (prisma as any).savingsCalculatorNewEntry.findUnique({
      where: { id }
    });
  }

  static async getEntryOrVersion(id: string, version?: number) {
    if (version !== undefined) {
      const historyEntry = await (prisma as any).savingsCalculatorNewEntryHistory.findFirst({
        where: { entryId: id, version }
      });
      if (historyEntry) {
        return {
          ...historyEntry,
          id: historyEntry.entryId
        };
      }
      return null;
    }
    return this.getById(id);
  }

  static async create(data: {
    clientName: string;
    industryName: string;
    address: string;
    sanctionedLoadKw?: number;
    stateCode?: string;
    discom?: string;
    consumerCategory?: string;
    voltageLevel?: string;
    proltMargin?: number;
    traderMargin?: number;
    meteringCharges?: number | null;
    consultancyFee?: number;
    probusPlatformFee?: number;
    todConsumptions?: any;
    applyElectricityDuty?: boolean;
    billedDemandKv?: number | null;
    powerFactor?: number | null;
    arrearAmount?: number | null;
    currentLpsc?: number | null;
    billDate?: string | null;
    createdBy?: string;
    updatedBy?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const entry = await (tx as any).savingsCalculatorNewEntry.create({
        data: {
          clientName: data.clientName,
          industryName: data.industryName,
          address: data.address,
          sanctionedLoadKw: data.sanctionedLoadKw,
          stateCode: data.stateCode,
          discom: data.discom,
          consumerCategory: data.consumerCategory,
          voltageLevel: data.voltageLevel,
          proltMargin: data.proltMargin,
          traderMargin: data.traderMargin,
          meteringCharges: data.meteringCharges,
          consultancyFee: data.consultancyFee,
          probusPlatformFee: data.probusPlatformFee,
          todConsumptions: data.todConsumptions,
          applyElectricityDuty: data.applyElectricityDuty,
          billedDemandKv: data.billedDemandKv,
          powerFactor: data.powerFactor,
          arrearAmount: data.arrearAmount,
          currentLpsc: data.currentLpsc,
          billDate: data.billDate,
          createdBy: data.createdBy,
          updatedBy: data.updatedBy
        }
      });

      await (tx as any).savingsCalculatorNewEntryHistory.create({
        data: {
          entryId: entry.id,
          version: 1,
          clientName: entry.clientName,
          industryName: entry.industryName,
          address: entry.address,
          sanctionedLoadKw: entry.sanctionedLoadKw,
          stateCode: entry.stateCode,
          discom: entry.discom,
          consumerCategory: entry.consumerCategory,
          voltageLevel: entry.voltageLevel,
          proltMargin: entry.proltMargin,
          traderMargin: entry.traderMargin,
          meteringCharges: entry.meteringCharges,
          consultancyFee: entry.consultancyFee,
          probusPlatformFee: entry.probusPlatformFee,
          todConsumptions: entry.todConsumptions,
          applyElectricityDuty: entry.applyElectricityDuty,
          billedDemandKv: entry.billedDemandKv,
          powerFactor: entry.powerFactor,
          arrearAmount: entry.arrearAmount,
          currentLpsc: entry.currentLpsc,
          billDate: entry.billDate,
          createdBy: entry.createdBy,
          updatedBy: entry.updatedBy
        }
      });

      return entry;
    });
  }

  static async update(id: string, data: {
    clientName: string;
    industryName: string;
    address: string;
    sanctionedLoadKw?: number;
    stateCode?: string;
    discom?: string;
    consumerCategory?: string;
    voltageLevel?: string;
    proltMargin?: number;
    traderMargin?: number;
    meteringCharges?: number | null;
    consultancyFee?: number;
    probusPlatformFee?: number;
    todConsumptions?: any;
    applyElectricityDuty?: boolean;
    billedDemandKv?: number | null;
    powerFactor?: number | null;
    arrearAmount?: number | null;
    currentLpsc?: number | null;
    billDate?: string | null;
    updatedBy?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const entry = await (tx as any).savingsCalculatorNewEntry.update({
        where: { id },
        data: {
          clientName: data.clientName,
          industryName: data.industryName,
          address: data.address,
          sanctionedLoadKw: data.sanctionedLoadKw,
          stateCode: data.stateCode,
          discom: data.discom,
          consumerCategory: data.consumerCategory,
          voltageLevel: data.voltageLevel,
          proltMargin: data.proltMargin,
          traderMargin: data.traderMargin,
          meteringCharges: data.meteringCharges,
          consultancyFee: data.consultancyFee,
          probusPlatformFee: data.probusPlatformFee,
          todConsumptions: data.todConsumptions,
          ...(data.applyElectricityDuty !== undefined && { applyElectricityDuty: data.applyElectricityDuty }),
          billedDemandKv: data.billedDemandKv,
          powerFactor: data.powerFactor,
          arrearAmount: data.arrearAmount,
          currentLpsc: data.currentLpsc,
          billDate: data.billDate,
          updatedBy: data.updatedBy
        }
      });

      const lastHistory = await (tx as any).savingsCalculatorNewEntryHistory.findFirst({
        where: { entryId: id },
        orderBy: { version: 'desc' }
      });
      const nextVersion = lastHistory ? lastHistory.version + 1 : 1;

      await (tx as any).savingsCalculatorNewEntryHistory.create({
        data: {
          entryId: entry.id,
          version: nextVersion,
          clientName: entry.clientName,
          industryName: entry.industryName,
          address: entry.address,
          sanctionedLoadKw: entry.sanctionedLoadKw,
          stateCode: entry.stateCode,
          discom: entry.discom,
          consumerCategory: entry.consumerCategory,
          voltageLevel: entry.voltageLevel,
          proltMargin: entry.proltMargin,
          traderMargin: entry.traderMargin,
          meteringCharges: entry.meteringCharges,
          consultancyFee: entry.consultancyFee,
          probusPlatformFee: entry.probusPlatformFee,
          todConsumptions: entry.todConsumptions,
          applyElectricityDuty: entry.applyElectricityDuty,
          billedDemandKv: entry.billedDemandKv,
          powerFactor: entry.powerFactor,
          arrearAmount: entry.arrearAmount,
          currentLpsc: entry.currentLpsc,
          billDate: entry.billDate,
          createdBy: entry.createdBy,
          updatedBy: entry.updatedBy
        }
      });

      await invalidateCache(`market-new:${id}:*`);
      await invalidateCache(`calc-new:savings:${id}:*`);

      return entry;
    });
  }

  static async delete(id: string) {
    const res = await (prisma as any).savingsCalculatorNewEntry.delete({
      where: { id }
    });
    await invalidateCache(`market-new:${id}:*`);
    await invalidateCache(`calc-new:savings:${id}:*`);
    return res;
  }

  static async getHistory(id: string) {
    return (prisma as any).savingsCalculatorNewEntryHistory.findMany({
      where: { entryId: id },
      orderBy: { version: 'desc' }
    });
  }

  // Parse custom TOD slots helper
  private static parseCustomTodSlots(monthData: any): CustomTodSlot[] {
    if (!monthData) return [];
    if (Array.isArray(monthData)) {
      return monthData.map((s, idx) => ({
        id: s.id || `tod-${idx + 1}`,
        name: s.name || `TOD ${idx + 1}`,
        startTime: s.startTime || '00:00',
        endTime: s.endTime || '24:00',
        consumptionKwh: Number(s.consumptionKwh || s.consumption || 0),
        effectivePrice: Number(s.effectivePrice || s.price || 0)
      }));
    }
    if (typeof monthData === 'object' && monthData.slots && Array.isArray(monthData.slots)) {
      return monthData.slots.map((s: any, idx: number) => ({
        id: s.id || `tod-${idx + 1}`,
        name: s.name || `TOD ${idx + 1}`,
        startTime: s.startTime || '00:00',
        endTime: s.endTime || '24:00',
        consumptionKwh: Number(s.consumptionKwh || s.consumption || 0),
        effectivePrice: Number(s.effectivePrice || s.price || 0)
      }));
    }
    // Object map format: { "TOD 1": { startTime: "05:00", endTime: "08:00", consumptionKwh: 1000, effectivePrice: 7.5 } }
    if (typeof monthData === 'object') {
      return Object.entries(monthData).map(([key, val]: [string, any], idx: number) => {
        if (typeof val === 'object' && val !== null) {
          return {
            id: val.id || `tod-${idx + 1}`,
            name: val.name || key,
            startTime: val.startTime || '00:00',
            endTime: val.endTime || '24:00',
            consumptionKwh: Number(val.consumptionKwh || val.consumption || 0),
            effectivePrice: Number(val.effectivePrice || val.price || 0)
          };
        }
        return {
          id: `tod-${idx + 1}`,
          name: key,
          startTime: '00:00',
          endTime: '24:00',
          consumptionKwh: Number(val || 0),
          effectivePrice: 7.5
        };
      });
    }
    return [];
  }

  // Check if time "HH:MM" falls inside TOD window [startTime, endTime)
  private static isTimeInWindow(timeStr: string, startTime: string, endTime: string): boolean {
    const parseMins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    };
    const cur = parseMins(timeStr);
    const start = parseMins(startTime);
    let end = parseMins(endTime);

    if (end === 0 && endTime !== '00:00') end = 24 * 60;
    if (start === end) return true; // full day

    if (start < end) {
      return cur >= start && cur < end;
    } else {
      // Overnight slot e.g. 22:00 to 06:00
      return cur >= start || cur < end;
    }
  }

  // Savings calculation execution
  static async calculateSavings(id: string, targetMonth?: string, version?: number) {
    if (targetMonth === 'all') {
      return this.calculateSavingsAllMonths(id, version);
    }
    const entry = await this.getEntryOrVersion(id, version);
    if (!entry) throw new Error('Entry not found');

    const todConsumptions = entry.todConsumptions as Record<string, any> | null;
    if (!todConsumptions || Object.keys(todConsumptions).length === 0) {
      throw new Error('No TOD consumption data found.');
    }

    let monthsToProcess = Object.entries(todConsumptions);
    if (targetMonth) {
      monthsToProcess = monthsToProcess.filter(([ym]) => ym === targetMonth);
      if (monthsToProcess.length === 0) {
        throw new Error(`No consumption data found for month ${targetMonth}`);
      }
    }

    let totalBaselineCost = 0;
    let totalOptimizedCost = 0;
    let totalEnergyKwh = 0;
    let totalMarketEnergyKwh = 0;

    for (const [yearMonth, monthData] of monthsToProcess) {
      const slots = this.parseCustomTodSlots(monthData);
      for (const slot of slots) {
        const slotEnergy = slot.consumptionKwh;
        const slotCost = slotEnergy * slot.effectivePrice;
        totalBaselineCost += slotCost;
        totalEnergyKwh += slotEnergy;
      }
    }

    const decision = await this.calculateMarketDecision(id, targetMonth, version);
    totalBaselineCost = decision.totalBaselineCost;
    totalOptimizedCost = decision.totalOptimizedCost;
    const totalSavings = totalBaselineCost - totalOptimizedCost;

    return {
      clientId: entry.id,
      clientName: entry.clientName,
      sanctionedLoad: Number(entry.sanctionedLoadKw) || 0,
      maxEnergyPerSlot: (Number(entry.sanctionedLoadKw) || 0) * 0.9 * 0.25,
      totalEnergyKwh,
      totalMarketEnergyKwh: decision.totalMarketEnergyKwh,
      totalBaselineCost,
      totalOptimizedCost,
      totalSavings,
      todGroups: {},
      sortedMonthlyList: []
    };
  }

  static async calculateSavingsAllMonths(id: string, version?: number) {
    const entry = await this.getEntryOrVersion(id, version);
    if (!entry) throw new Error('Entry not found');
    const todConsumptions = entry.todConsumptions as any;
    if (!todConsumptions) throw new Error('No consumption data found');

    const months = Object.keys(todConsumptions).sort();
    let totalSavings = 0;
    let totalOptimizedCost = 0;
    let totalBaselineCost = 0;
    let totalEnergyKwh = 0;
    let totalMarketEnergyKwh = 0;

    for (const month of months) {
      try {
        const res = await this.calculateSavings(id, month, version);
        if (res) {
          totalSavings += res.totalSavings;
          totalOptimizedCost += res.totalOptimizedCost;
          totalBaselineCost += res.totalBaselineCost;
          totalEnergyKwh += res.totalEnergyKwh;
          totalMarketEnergyKwh += res.totalMarketEnergyKwh;
        }
      } catch (e) {
        console.error('Error calculating month in savings-calculator-new', month, e);
      }
    }

    return {
      clientId: entry.id,
      clientName: entry.clientName,
      sanctionedLoad: Number(entry.sanctionedLoadKw) || 0,
      maxEnergyPerSlot: (Number(entry.sanctionedLoadKw) || 0) * 0.9 * 0.25,
      totalEnergyKwh,
      totalMarketEnergyKwh,
      totalBaselineCost,
      totalOptimizedCost,
      totalSavings,
      todGroups: {},
      sortedMonthlyList: []
    };
  }

  // Calculate Market Decision for custom TOD slots
  static async calculateMarketDecision(id: string, targetMonth?: string, version?: number) {
    const entry = await this.getEntryOrVersion(id, version);
    if (!entry) throw new Error('Entry not found');

    const stateCode = entry.stateCode || 'MH';
    const sanctionedLoad = entry.sanctionedLoadKw ? Number(entry.sanctionedLoadKw) : 100;

    const todConsumptions = entry.todConsumptions as Record<string, any> | null;
    if (!todConsumptions || Object.keys(todConsumptions).length === 0) {
      throw new Error('No TOD consumption data found.');
    }

    let monthsToProcess = Object.entries(todConsumptions);
    if (targetMonth && targetMonth !== 'all') {
      monthsToProcess = monthsToProcess.filter(([ym]) => ym === targetMonth);
    }
    if (monthsToProcess.length === 0) {
      throw new Error(`No consumption data found for month ${targetMonth}`);
    }

    let totalBaselineCost = 0;
    let totalOptimizedCost = 0;
    let totalEnergyKwh = 0;
    let totalMarketEnergyKwh = 0;
    let totalLandedExchangeCost = 0;
    let totalDiscomAfterProlt = 0;

    const aggregatedTotals = {
      cssCharge: 0, cssRate: 0, rpoCharge: 0, pocCharge: 0, stuCharge: 0,
      dcCharge: 0, iexFee: 0, traderMargin: 0, traderMarginGst: 0, proltMarginCost: 0,
      consultancyFee: 0, probusPlatformFee: 0
    };

    let stateName = entry.stateCode || stateCode;
    if (stateName) {
      const rs = await prisma.regionState.findFirst({ where: { stateCode: stateName } });
      if (rs && rs.stateName) {
        stateName = rs.stateName;
      }
    }
    const stateFormats = [stateName, stateName.toUpperCase(), stateName.toUpperCase().replace(/\s+/g, '_')];

    const category = entry.consumerCategory || 'Industrial';
    let parsedCategory = category;
    let parsedSubCategory = undefined;
    if (category.includes(' | ')) {
      const parts = category.split(' | ');
      parsedCategory = parts[0];
      parsedSubCategory = parts[1];
    }

    const slotsData: any[] = [];
    const todSummaries: any[] = [];

    for (const [yearMonth, monthData] of monthsToProcess) {
      const customSlots = this.parseCustomTodSlots(monthData);
      const [yearStr, monthStr] = yearMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // Fetch state charges for losses & fees
      const stateCharges = await prisma.stateCharges.findFirst({
        where: {
          state: { in: stateFormats },
          category: parsedCategory,
          fromDate: { lte: new Date(startStr) },
          toDate: { gte: new Date(startStr) }
        }
      });
      const stuLoss = stateCharges?.stuLossPercent ? Number(stateCharges.stuLossPercent) : 0;
      const wheelingLoss = stateCharges?.wheelingLossPercent ? Number(stateCharges.wheelingLossPercent) : 0;
      const cssRate = stateCharges?.crossSubsidy ? Number(stateCharges.crossSubsidy) : 0;
      const addChargeRate = stateCharges?.additionalCharge ? Number(stateCharges.additionalCharge) : 0;

      // Query market MCP for the month
      const query = `
        SELECT
            COALESCE(dam.date, rtm.date, gdam.date) AS date,
            COALESCE(dam.timeblock, rtm.timeblock, gdam.timeblock) AS timeblock,
            dam.mcp AS "damMcp",
            rtm.mcp AS "rtmMcp",
            gdam.mcp AS "gdamMcp"
        FROM
            (SELECT d."deliveryDate" as date, dr."intervalNumber" as timeblock, dr.mcp 
             FROM "DamRecord" dr 
             JOIN "Dataset" d ON dr."datasetId" = d.id 
             WHERE d.market = 'DAM' AND d.status = 'ACTIVE' AND d."deliveryDate" >= '${startStr}'::date AND d."deliveryDate" <= '${endStr}'::date) dam
        FULL OUTER JOIN
            (SELECT d."deliveryDate" as date, rr."intervalNumber" as timeblock, rr.mcp 
             FROM "RtmRecord" rr 
             JOIN "Dataset" d ON rr."datasetId" = d.id 
             WHERE d.market = 'RTM' AND d.status = 'ACTIVE' AND d."deliveryDate" >= '${startStr}'::date AND d."deliveryDate" <= '${endStr}'::date) rtm
            ON dam.date = rtm.date AND dam.timeblock = rtm.timeblock
        FULL OUTER JOIN
            (SELECT d."deliveryDate" as date, gr."intervalNumber" as timeblock, gr.mcp 
             FROM "GdamRecord" gr 
             JOIN "Dataset" d ON gr."datasetId" = d.id 
             WHERE d.market = 'GDAM' AND d.status = 'ACTIVE' AND d."deliveryDate" >= '${startStr}'::date AND d."deliveryDate" <= '${endStr}'::date) gdam
            ON COALESCE(dam.date, rtm.date) = gdam.date AND COALESCE(dam.timeblock, rtm.timeblock) = gdam.timeblock
        ORDER BY date ASC, timeblock ASC;
      `;

      let records: any[] = [];
      try {
        records = await prisma.$queryRawUnsafe(query);
      } catch (e) {
        console.error('Error querying market records in savings-calculator-new:', e);
      }

      // Map market records and assign Discom Effective Price per custom TOD slot
      const monthlySlots = records.map(rec => {
        const deliveryDate = rec.date ? new Date(rec.date) : new Date(startStr);
        const dateStr = deliveryDate.toISOString().split('T')[0];
        const slot = rec.timeblock || rec.timeblock === 0 ? Number(rec.timeblock) : 1;

        const startMinutes = (slot - 1) * 15;
        const hour = Math.floor(startMinutes / 60);
        const minute = startMinutes % 60;
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        // Find which custom TOD slot covers this 15-minute timeblock
        const matchedCustomSlot = customSlots.find(cs => this.isTimeInWindow(timeStr, cs.startTime, cs.endTime));

        // Exact Discom price given by user ("no extra tings nothing")
        const discomLandingPrice = matchedCustomSlot ? matchedCustomSlot.effectivePrice : 0;
        const matchedTariffName = matchedCustomSlot ? (matchedCustomSlot.name || `${matchedCustomSlot.startTime}-${matchedCustomSlot.endTime}`) : 'OUTSIDE_TOD';

        const rawDam = rec.damMcp !== undefined ? rec.damMcp : rec.dammcp;
        const rawRtm = rec.rtmMcp !== undefined ? rec.rtmMcp : rec.rtmmcp;
        const rawGdam = rec.gdamMcp !== undefined ? rec.gdamMcp : rec.gdammcp;

        const damLandingPrice = rawDam ? (Number(rawDam) / 1000) : 0;
        const rtmLandingPrice = rawRtm ? (Number(rawRtm) / 1000) : 0;
        const gdamLandingPrice = rawGdam ? (Number(rawGdam) / 1000) : 0;

        let comparedLowestPrice = discomLandingPrice;
        let selectedSource = 'DISCOM';

        if (matchedCustomSlot) {
          const availableMarkets = [];
          if (sanctionedLoad >= 1000) {
            if (damLandingPrice > 0) availableMarkets.push({ source: 'DAM', price: damLandingPrice });
            if (rtmLandingPrice > 0) availableMarkets.push({ source: 'RTM', price: rtmLandingPrice });
          }
          if (gdamLandingPrice > 0) availableMarkets.push({ source: 'GDAM', price: gdamLandingPrice });

          if (availableMarkets.length > 0) {
            availableMarkets.sort((a, b) => a.price - b.price);
            comparedLowestPrice = availableMarkets[0].price;
            selectedSource = availableMarkets[0].source;
          }
        }

        return {
          date: dateStr,
          slot,
          timeStr,
          todSlab: matchedTariffName,
          customSlotId: matchedCustomSlot?.id,
          damLandingPrice,
          rtmLandingPrice,
          gdamLandingPrice,
          discomLandingPrice,
          comparedLowestPrice,
          selectedSource,
          maxEnergyPerSlot: 0,
          optimizedCost: 0,
          baselineCost: 0,
          istsLoss: 0,
          stuLoss,
          wheelingLoss
        };
      });

      // Calculate Discom baseline cost and allocate energy across TOD windows
      const maxEnergyPerSlot = sanctionedLoad * 0.9 * 0.25;

      for (const customSlot of customSlots) {
        const slotEnergyTotal = customSlot.consumptionKwh;
        const slotDiscomPrice = customSlot.effectivePrice;
        const slotDiscomBaselineCost = slotEnergyTotal * slotDiscomPrice;

        totalBaselineCost += slotDiscomBaselineCost;
        totalEnergyKwh += slotEnergyTotal;

        // Filter 15-minute timeblocks belonging to this custom TOD slot
        const slotBlocks = monthlySlots.filter(s => s.customSlotId === customSlot.id || s.todSlab === (customSlot.name || `${customSlot.startTime}-${customSlot.endTime}`));
        const totalActiveBlocks = slotBlocks.length || 1;
        const energyPerBlock = Math.min(maxEnergyPerSlot, slotEnergyTotal / totalActiveBlocks);

        let allocatedEnergy = 0;
        slotBlocks.forEach(sb => {
          if (allocatedEnergy < slotEnergyTotal) {
            const takeEnergy = Math.min(energyPerBlock, slotEnergyTotal - allocatedEnergy);
            sb.maxEnergyPerSlot = takeEnergy;
            sb.baselineCost = takeEnergy * slotDiscomPrice;

            if (sb.selectedSource !== 'DISCOM' && sb.comparedLowestPrice > 0) {
              sb.optimizedCost = takeEnergy * sb.comparedLowestPrice;
              totalMarketEnergyKwh += takeEnergy;
              totalLandedExchangeCost += sb.optimizedCost;
            } else {
              sb.optimizedCost = sb.baselineCost;
              totalDiscomAfterProlt += sb.optimizedCost;
            }
            allocatedEnergy += takeEnergy;
          } else {
            sb.maxEnergyPerSlot = 0;
            sb.baselineCost = 0;
            sb.optimizedCost = 0;
          }
        });

        todSummaries.push({
          month: yearMonth,
          slotName: customSlot.name || `${customSlot.startTime}-${customSlot.endTime}`,
          startTime: customSlot.startTime,
          endTime: customSlot.endTime,
          consumptionKwh: slotEnergyTotal,
          effectivePrice: slotDiscomPrice,
          baselineCost: slotDiscomBaselineCost
        });
      }

      slotsData.push(...monthlySlots);
    }

    totalOptimizedCost = totalLandedExchangeCost + totalDiscomAfterProlt;
    const totalSavings = totalBaselineCost - totalOptimizedCost;

    return {
      clientId: entry.id,
      clientName: entry.clientName,
      slotsData,
      todSummaries,
      totalEnergyKwh,
      totalMarketEnergyKwh,
      totalBaselineCost,
      totalLandedExchangeCost,
      totalDiscomAfterProlt,
      totalOptimizedCost,
      totalSavings,
      demandCharge: 0,
      electricityDuty: 0,
      arrearAmount: entry.arrearAmount ? Number(entry.arrearAmount) : 0,
      currentLpsc: entry.currentLpsc ? Number(entry.currentLpsc) : 0,
      discom: entry.discom,
      oaDetailed: {
        breakdown: [],
        dailyFixedOverhead: 0,
        nldcSchedulingCost: 0,
        sldcSchedulingCost: 0,
        bidApplicationFees: 0,
        totalDaysTraded: 0,
        totals: aggregatedTotals
      }
    };
  }

  static async calculateMarketDecisionAllMonths(id: string, version?: number) {
    return this.calculateMarketDecision(id, 'all', version);
  }

  static async getClientOverview(id: string) {
    const entry = await this.getById(id);
    if (!entry) throw new Error('Entry not found');

    const todConsumptions = entry.todConsumptions as Record<string, any> | null;
    if (!todConsumptions || Object.keys(todConsumptions).length === 0) {
      return {
        clientName: entry.clientName,
        industryName: entry.industryName,
        months: [],
        totalSavings: 0
      };
    }

    const months = Object.keys(todConsumptions).sort();
    let totalSavings = 0;
    const monthsData = [];

    for (const month of months) {
      try {
        const result = await this.calculateMarketDecision(id, month);
        const netSavings = result.totalSavings;
        totalSavings += netSavings;

        monthsData.push({
          month,
          savings: netSavings,
          totalEnergyKwh: result.totalEnergyKwh,
          totalMarketEnergyKwh: result.totalMarketEnergyKwh,
          totalBaselineCost: result.totalBaselineCost,
          totalOptimizedCost: result.totalOptimizedCost
        });
      } catch (error) {
        console.error(`Error calculating savings-calculator-new for month ${month}:`, error);
        monthsData.push({
          month,
          savings: 0,
          error: 'Calculation failed'
        });
      }
    }

    return {
      clientName: entry.clientName,
      industryName: entry.industryName,
      months: monthsData,
      totalSavings
    };
  }
}
