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
    if (!todConsumptions || Object.keys(todConsumptions).filter(m => !m.startsWith('_') && m.includes('-')).length === 0) {
      throw new Error('No TOD consumption data found.');
    }

    let monthsToProcess = Object.entries(todConsumptions).filter(([ym]) => !ym.startsWith('_') && ym.includes('-'));
    if (targetMonth && targetMonth !== 'all') {
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

    const months = Object.keys(todConsumptions).filter(m => !m.startsWith('_') && m.includes('-')).sort();
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
    if (!todConsumptions || Object.keys(todConsumptions).filter(m => !m.startsWith('_') && m.includes('-')).length === 0) {
      throw new Error('No TOD consumption data found.');
    }

    let monthsToProcess = Object.entries(todConsumptions).filter(([ym]) => !ym.startsWith('_') && ym.includes('-'));
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

      if (isNaN(year) || isNaN(month)) {
        continue;
      }

      const lastDay = new Date(year, month, 0).getDate();
      const startStr = (typeof monthData === 'object' && monthData.startDate) ? monthData.startDate : `${year}-${String(month).padStart(2, '0')}-01`;
      const endStr = (typeof monthData === 'object' && monthData.endDate) ? monthData.endDate : `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const monthPeakDemand = (typeof monthData === 'object' && monthData.peakDemandKw) ? Number(monthData.peakDemandKw) : (sanctionedLoad || 1000);

      // Fetch state charges for losses & surcharges
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
      const stuCharge = stateCharges?.stuCharges ? Number(stateCharges.stuCharges) : 0;
      const wheelingCharge = stateCharges?.distributionWheelingCharges ? Number(stateCharges.distributionWheelingCharges) : 0;

      const yyyymmMonth = year * 100 + month;
      const ctuCharges = !isNaN(yyyymmMonth) ? await prisma.ctuCharges.findFirst({ where: { month: yyyymmMonth } }) : null;
      const ctuCharge = ctuCharges?.ctu_charges_rs_per_kwh ? Number(ctuCharges.ctu_charges_rs_per_kwh) : 0;

      const istsCharges = await prisma.istsCharges.findMany({
        where: {
          OR: [{ startDate: { lte: new Date(endStr) }, endDate: { gte: new Date(startStr) } }]
        }
      });

      // Total per-kWh OA Surcharges & Overhead
      const totalOaSurcharges = cssRate + addChargeRate + stuCharge + wheelingCharge + ctuCharge + 0.02;

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

        let istsLoss = 0;
        const matchingIsts = istsCharges.find(i => deliveryDate >= i.startDate && deliveryDate <= i.endDate);
        if (matchingIsts) {
          istsLoss = Number(matchingIsts.istsLossPercent || 0);
        }

        const lossMultiplier = (1 + stuLoss / 100) * (1 + wheelingLoss / 100) * (1 + istsLoss / 100);

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

        const damLandingPrice = rawDam ? ((Number(rawDam) / 1000) * lossMultiplier + totalOaSurcharges) : 0;
        const rtmLandingPrice = rawRtm ? ((Number(rawRtm) / 1000) * lossMultiplier + totalOaSurcharges) : 0;
        const gdamLandingPrice = rawGdam ? ((Number(rawGdam) / 1000) * lossMultiplier + totalOaSurcharges) : 0;

        let comparedLowestPrice = discomLandingPrice;
        let selectedSource = 'DISCOM';

        if (matchedCustomSlot) {
          const availableMarkets = [];
          const is1MWOrMore = (sanctionedLoad >= 1000) || (monthPeakDemand >= 1000);

          if (is1MWOrMore) {
            // Sanctioned Load >= 1000 kW: can buy from anywhere (DAM, RTM, GDAM)
            if (damLandingPrice > 0) availableMarkets.push({ source: 'DAM', price: damLandingPrice });
            if (rtmLandingPrice > 0) availableMarkets.push({ source: 'RTM', price: rtmLandingPrice });
            if (gdamLandingPrice > 0) availableMarkets.push({ source: 'GDAM', price: gdamLandingPrice });
          } else {
            // Sanctioned Load < 1000 kW: can ONLY buy from GDAM (or DISCOM)
            if (gdamLandingPrice > 0) availableMarkets.push({ source: 'GDAM', price: gdamLandingPrice });
          }

          if (availableMarkets.length > 0) {
            availableMarkets.sort((a, b) => a.price - b.price);
            if (availableMarkets[0].price < discomLandingPrice) {
              comparedLowestPrice = availableMarkets[0].price;
              selectedSource = availableMarkets[0].source;
            }
          }
        }

        return {
          date: dateStr,
          slot,
          timeblock: slot,
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
          discomEnergy: 0,
          marketEnergy: 0,
          optimizedCost: 0,
          baselineCost: 0,
          istsLoss,
          stuLoss,
          wheelingLoss
        };
      });

      // Calculate Discom baseline cost and allocate energy across TOD windows
      const maxEnergyPerSlot = monthPeakDemand * 0.25;

      for (const customSlot of customSlots) {
        const slotEnergyTotal = customSlot.consumptionKwh;
        const slotDiscomPrice = Number(customSlot.effectivePrice) > 0 ? Number(customSlot.effectivePrice) : 8.5;
        const slotDiscomBaselineCost = slotEnergyTotal * slotDiscomPrice;

        totalBaselineCost += slotDiscomBaselineCost;
        totalEnergyKwh += slotEnergyTotal;

        // Filter 15-minute timeblocks belonging to this custom TOD slot
        const slotBlocks = monthlySlots.filter(s => s.customSlotId === customSlot.id || s.todSlab === (customSlot.name || `${customSlot.startTime}-${customSlot.endTime}`));
        const totalActiveBlocks = slotBlocks.length || 1;
        const energyPerBlock = Math.min(maxEnergyPerSlot, slotEnergyTotal / totalActiveBlocks);

        let allocatedEnergy = 0;
        let slotMarketEnergy = 0;
        let slotMarketCost = 0;
        let slotDiscomCost = 0;

        slotBlocks.forEach(sb => {
          if (allocatedEnergy < slotEnergyTotal) {
            const takeEnergy = Math.min(energyPerBlock, slotEnergyTotal - allocatedEnergy);
            sb.maxEnergyPerSlot = takeEnergy;
            sb.baselineCost = takeEnergy * slotDiscomPrice;

            if (sb.selectedSource !== 'DISCOM' && sb.comparedLowestPrice > 0) {
              sb.marketEnergy = takeEnergy;
              sb.discomEnergy = 0;
              sb.optimizedCost = takeEnergy * sb.comparedLowestPrice;
              totalMarketEnergyKwh += takeEnergy;
              totalLandedExchangeCost += sb.optimizedCost;
              slotMarketEnergy += takeEnergy;
              slotMarketCost += sb.optimizedCost;
            } else {
              sb.discomEnergy = takeEnergy;
              sb.marketEnergy = 0;
              sb.optimizedCost = sb.baselineCost;
              totalDiscomAfterProlt += sb.optimizedCost;
              slotDiscomCost += sb.optimizedCost;
            }
            allocatedEnergy += takeEnergy;
          } else {
            sb.maxEnergyPerSlot = 0;
            sb.discomEnergy = 0;
            sb.marketEnergy = 0;
            sb.baselineCost = 0;
            sb.optimizedCost = 0;
          }
        });

        const slotName = customSlot.name || `${customSlot.startTime}-${customSlot.endTime}`;
        todSummaries.push({
          month: yearMonth,
          slotName: slotName,
          slabName: slotName,
          startTime: customSlot.startTime,
          endTime: customSlot.endTime,
          consumptionKwh: slotEnergyTotal,
          totalEnergyKwh: slotEnergyTotal,
          effectivePrice: slotDiscomPrice,
          baselineCost: slotDiscomBaselineCost,
          discomBill: slotDiscomBaselineCost,
          marketEnergyKwh: slotMarketEnergy,
          oaUnits: slotMarketEnergy,
          consumerBusUnits: slotMarketEnergy,
          discomUnits: slotEnergyTotal,
          marketCostBase: slotMarketCost,
          oaBill: slotMarketCost,
          proltDiscomBill: slotDiscomCost,
          savings: Math.max(0, slotDiscomBaselineCost - (slotMarketCost + slotDiscomCost))
        });

        aggregatedTotals.cssRate = cssRate;
        aggregatedTotals.cssCharge += slotMarketEnergy * cssRate;
        aggregatedTotals.rpoCharge += slotMarketEnergy * 0.25;
        aggregatedTotals.pocCharge += slotMarketEnergy * ctuCharge;
        aggregatedTotals.stuCharge += slotMarketEnergy * stuCharge;
        aggregatedTotals.dcCharge += slotMarketEnergy * wheelingCharge;
        aggregatedTotals.iexFee += slotMarketEnergy * 0.02;
      }

      slotsData.push(...monthlySlots);
    }

    // Query IEX Fees from Resource Center for SLDC/NLDC scheduling fees
    const latestMonthToProcess = monthsToProcess[0]?.[0] || '';
    const [yS, mS] = latestMonthToProcess.split('-');
    const yyyymmVal = (parseInt(yS, 10) || 2026) * 100 + (parseInt(mS, 10) || 5);
    const iexFees = await prisma.iexFees.findFirst({ where: { month: yyyymmVal } });
    const nldcSchedulingFees = Number(iexFees?.nldcSchedulingFees || 20);
    const sldcSchedulingFees = Number(iexFees?.sldcSchedulingFees || 1500);

    const tradedDays = { DAM: new Set<string>(), GDAM: new Set<string>(), RTM: new Set<string>() };
    slotsData.forEach(s => {
      if (s.selectedSource !== 'DISCOM' && s.maxEnergyPerSlot > 0) {
        if (s.selectedSource === 'DAM') tradedDays.DAM.add(s.date);
        else if (s.selectedSource === 'GDAM') tradedDays.GDAM.add(s.date);
        else if (s.selectedSource === 'RTM') tradedDays.RTM.add(s.date);
      }
    });

    const totalDamDays = tradedDays.DAM.size;
    const totalGdamDays = tradedDays.GDAM.size;
    const totalRtmDays = tradedDays.RTM.size;
    const allTradedDates = new Set([...tradedDays.DAM, ...tradedDays.GDAM, ...tradedDays.RTM]);
    const totalDaysTraded = allTradedDates.size;

    const nldcSchedulingCost = nldcSchedulingFees * totalDaysTraded;
    const sldcSchedulingCost = sldcSchedulingFees * (totalDamDays + totalGdamDays + totalRtmDays);
    const dailyFixedOverhead = nldcSchedulingCost + sldcSchedulingCost;
    const bidApplicationFees = (totalDamDays + totalGdamDays + totalRtmDays) * 5;

    const proltMarginVal = Number(entry.proltMargin) || 0;
    const traderMarginVal = Number(entry.traderMargin) || 0;
    const consultancyFeeVal = Number(entry.consultancyFee) || 0;
    const probusPlatformFeeVal = Number(entry.probusPlatformFee) || 0;
    const meteringChargesVal = Number(entry.meteringCharges) || 0;

    const traderMarginCost = totalMarketEnergyKwh * traderMarginVal * 1.18;

    // Calculate gross savings before PROLT percentage margin
    const baseOtherCosts = totalLandedExchangeCost + totalDiscomAfterProlt + traderMarginCost + consultancyFeeVal + probusPlatformFeeVal + meteringChargesVal + dailyFixedOverhead + bidApplicationFees;
    const grossSavings = Math.max(0, totalBaselineCost - baseOtherCosts);

    // Treat proltMarginVal as percentage of gross savings (e.g. 15 = 15% or 0.15 = 15%)
    const proltMarginPct = proltMarginVal > 1 ? (proltMarginVal / 100) : proltMarginVal;
    const proltMarginCost = grossSavings * proltMarginPct;

    const meta = (entry.todConsumptions as any)?._meta || {};

    const applyEd = entry.applyElectricityDuty !== false;
    const edPercent = applyEd 
      ? ((entry as any).electricityDutyPercent !== undefined && (entry as any).electricityDutyPercent !== null 
          ? Number((entry as any).electricityDutyPercent) 
          : (meta.electricityDutyPercent !== undefined ? Number(meta.electricityDutyPercent) : 5))
      : 0;

    const fppaPercent = (entry as any).fppaChargePercent !== undefined && (entry as any).fppaChargePercent !== null 
      ? Number((entry as any).fppaChargePercent) 
      : (meta.fppaChargePercent !== undefined ? Number(meta.fppaChargePercent) : 10);

    const demandChargeKwRate = (entry as any).demandChargeKwRate !== undefined && (entry as any).demandChargeKwRate !== null 
      ? Number((entry as any).demandChargeKwRate) 
      : (meta.demandChargeKwRate !== undefined ? Number(meta.demandChargeKwRate) : 250);

    const demandLoad = entry.billedDemandKv ? Number(entry.billedDemandKv) : (entry.sanctionedLoadKw ? Number(entry.sanctionedLoadKw) : 1000);
    const calculatedDemandCharge = Math.round(demandLoad * demandChargeKwRate);
    const fppaSurchargeVal = Math.round(totalBaselineCost * (fppaPercent / 100));
    const totalDiscomBeforeEd = totalBaselineCost + fppaSurchargeVal + calculatedDemandCharge;
    const electricityDutyVal = applyEd ? Math.round(totalDiscomBeforeEd * (edPercent / 100)) : 0;

    const fppaAfterOAVal = Math.round(totalDiscomAfterProlt * (fppaPercent / 100));
    const totalDiscomAfterOABeforeEd = totalDiscomAfterProlt + fppaAfterOAVal + calculatedDemandCharge;
    const electricityDutyAfterOAVal = applyEd ? Math.round(totalDiscomAfterOABeforeEd * (edPercent / 100)) : 0;

    aggregatedTotals.proltMarginCost = proltMarginCost;
    aggregatedTotals.traderMargin = traderMarginCost;
    aggregatedTotals.consultancyFee = consultancyFeeVal;
    aggregatedTotals.probusPlatformFee = probusPlatformFeeVal;
    (aggregatedTotals as any).meteringCharges = meteringChargesVal;
    (aggregatedTotals as any).grossSavings = grossSavings;

    totalOptimizedCost = baseOtherCosts + proltMarginCost;
    const totalSavings = Math.max(0, totalBaselineCost - totalOptimizedCost);

    const breakdown = todSummaries.map(t => ({
      slabName: t.slotName || t.slabName,
      discomUnits: t.consumptionKwh,
      oaUnits: t.marketEnergyKwh,
      discomBill: t.baselineCost,
      proltDiscomBill: t.proltDiscomBill,
      consumerBusUnits: t.marketEnergyKwh,
      oaBill: t.marketCostBase
    }));

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
      grossSavings,
      demandCharge: calculatedDemandCharge,
      electricityDuty: electricityDutyVal,
      electricityDutyAfterOA: electricityDutyAfterOAVal,
      fppaPercent,
      fppaCharge: fppaSurchargeVal,
      fppaChargeAfterOA: fppaAfterOAVal,
      electricityDutyPercent: edPercent,
      demandChargeKwRate,
      arrearAmount: entry.arrearAmount ? Number(entry.arrearAmount) : 0,
      currentLpsc: entry.currentLpsc ? Number(entry.currentLpsc) : 0,
      discom: entry.discom,
      oaDetailed: {
        breakdown,
        dailyFixedOverhead,
        nldcSchedulingCost,
        sldcSchedulingCost,
        bidApplicationFees,
        totalDaysTraded,
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

    const months = Object.keys(todConsumptions).filter(m => !m.startsWith('_') && m.includes('-')).sort();
    let totalSavings = 0;
    const monthsData = [];

    for (const month of months) {
      try {
        const result = await this.calculateMarketDecision(id, month);
        const netSavings = result.totalSavings;
        totalSavings += netSavings;

        const grossSav = (result as any).grossSavings ?? (result.oaDetailed?.totals as any)?.grossSavings ?? Math.max(0, result.totalBaselineCost - result.totalLandedExchangeCost - result.totalDiscomAfterProlt);

        monthsData.push({
          month,
          savings: netSavings,
          grossSavings: grossSav,
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
          grossSavings: 0,
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
