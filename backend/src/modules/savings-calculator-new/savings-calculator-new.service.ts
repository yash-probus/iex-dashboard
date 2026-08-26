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
      where: { id },
      include: { history: true }
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
    // Use full baseline cost to correctly compare against total optimized cost
    totalBaselineCost = decision.fullBaselineDiscomCost;
    totalOptimizedCost = decision.totalOptimizedCost;
    const totalSavings = decision.totalSavings;

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
  static async calculateMarketDecision(id: string, targetMonth?: string, version?: number, useShiftedProfile: boolean = false) {
    const entry = await this.getEntryOrVersion(id, version);
    if (!entry) throw new Error('Entry not found');

    const stateCode = entry.stateCode || 'MH';
    const sanctionedLoad = (entry.sanctionedLoadKw && Number(entry.sanctionedLoadKw) > 0) ? Number(entry.sanctionedLoadKw) : 1000;

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
    let totalElectricityDuty = 0;
    let totalElectricityDutyAfterOA = 0;

    const applyElectricityDuty = entry.applyElectricityDuty !== undefined ? entry.applyElectricityDuty : true;
    const electricityDutyPercent = Number((todConsumptions as any)?._meta?.electricityDutyPercent) || 5.0;


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
    let monthlyDbFppaSum = 0;
    let monthlyDbFppaCount = 0;

    const parseHour = (timeStr: string): number => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return h + (m || 0) / 60;
    };

    for (const [yearMonth, monthData] of monthsToProcess) {
      const customSlots = this.parseCustomTodSlots(monthData);
      const [yearStr, monthStr] = yearMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const calendarMonth = year * 100 + month;

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

      // Query IEX Fees for SLDC/NLDC scheduling fees
      const iexFees = await prisma.iexFees.findFirst({ where: { month: yyyymmMonth } });
      const nldcSchedulingFees = Number(iexFees?.nldcSchedulingFees || 20);
      const sldcSchedulingFees = Number(iexFees?.sldcSchedulingFees || 1500);

      // Query FPPA Charges backend table
      const fppaDataList = !isNaN(yyyymmMonth) ? await prisma.fppaCharges.findMany({
        where: {
          state: { in: stateFormats },
          month: yyyymmMonth
        }
      }) : [];
      let fppaData = fppaDataList.find(f => f.discom === entry.discom);
      if (!fppaData) {
        fppaData = fppaDataList.find(f => !f.discom || f.discom === '');
      }
      const dbFppaPercent = fppaData?.fppaChargePercent ? Number(fppaData.fppaChargePercent) : 0;
      monthlyDbFppaSum += dbFppaPercent;
      monthlyDbFppaCount++;

      const istsCharges = await prisma.istsCharges.findMany({
        where: {
          OR: [{ startDate: { lte: new Date(endStr) }, endDate: { gte: new Date(startStr) } }]
        }
      });

      // Total per-kWh OA Surcharges (CSS, STU, Wheeling, CTU, Additional Charges)
      const totalOaSurcharges = cssRate + addChargeRate + stuCharge + wheelingCharge + ctuCharge;

      // Fetch matching StateTariff slabs from DB for TOD Penalties
      let parsedSupplyVoltageCategory = entry.voltageLevel || '11 kV';
      if (parsedSupplyVoltageCategory.includes(' - ')) {
        parsedSupplyVoltageCategory = parsedSupplyVoltageCategory.split(' - ')[0];
      }
      
      const whereClauseTariff: any = {
        state: { in: stateFormats },
        discom: entry.discom === 'NPCL' ? 'NPCL' : null,
        consumerCategory: parsedCategory,
        supplyVoltageCategory: parsedSupplyVoltageCategory,
        OR: [
          { consumptionMonth: { in: [yyyymmMonth, calendarMonth] } },
          { month: { in: [yyyymmMonth, calendarMonth] }, consumptionMonth: null }
        ]
      };
      if (parsedSubCategory) {
        whereClauseTariff.subCategory = { contains: parsedSubCategory };
      }

      let tariffsForMonth = await prisma.stateTariff.findMany({ where: whereClauseTariff });
      
      if (tariffsForMonth.length === 0) {
        const fallbackWhere: any = { state: { in: stateFormats }, discom: entry.discom === 'NPCL' ? 'NPCL' : null, consumerCategory: parsedCategory, supplyVoltageCategory: parsedSupplyVoltageCategory };
        if (parsedSubCategory) fallbackWhere.subCategory = { contains: parsedSubCategory };
        const allTariffs = await prisma.stateTariff.findMany({
          where: fallbackWhere,
          orderBy: { month: 'desc' }
        });
        const sameMonthTariff = allTariffs.find(t => 
          t.consumptionMonth ? (t.consumptionMonth % 100) === month : (t.month % 100) === month
        );
        const latestTariff = sameMonthTariff || allTariffs[0];
        if (latestTariff) {
          tariffsForMonth = allTariffs.filter(t => t.month === latestTariff.month);
        }
      }

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

        // Exact Base Price given by user
        const baseEnergyRate = (matchedCustomSlot && Number(matchedCustomSlot.effectivePrice) > 0) ? Number(matchedCustomSlot.effectivePrice) : 8.5;
        
        // Find matching TOD tariff from backend
        let todChargePercent = 0;
        if (tariffsForMonth && tariffsForMonth.length > 0) {
          const currentHour = hour + minute / 60;
          let matchedTariff = tariffsForMonth.find(t => {
            if (!t.todStartTime || t.todStartTime === '—' || !t.todEndTime || t.todEndTime === '—') return false;
            const start = parseHour(t.todStartTime);
            const end = parseHour(t.todEndTime);
            if (end < start) {
              return currentHour >= start || currentHour < end;
            }
            return currentHour >= start && currentHour < end;
          });
          if (!matchedTariff) {
            matchedTariff = tariffsForMonth.find(t => !t.todStartTime || t.todStartTime === '—' || !t.todEndTime || t.todEndTime === '—');
          }
          if (matchedTariff) {
            todChargePercent = Number(matchedTariff.todChargePercent || 0);
          }
        }

        const todPenaltyRebate = baseEnergyRate * (todChargePercent / 100);
        const baseDiscomPrice = baseEnergyRate + todPenaltyRebate;

        const fppaMultiplier = 1 + (dbFppaPercent / 100);
        const discomLandingPrice = baseDiscomPrice * fppaMultiplier;
        
        const matchedTariffName = matchedCustomSlot ? (matchedCustomSlot.name || `${matchedCustomSlot.startTime}-${matchedCustomSlot.endTime}`) : 'OUTSIDE_TOD';

        const rawDam = rec.damMcp !== undefined ? rec.damMcp : rec.dammcp;
        const rawRtm = rec.rtmMcp !== undefined ? rec.rtmMcp : rec.rtmmcp;
        const rawGdam = rec.gdamMcp !== undefined ? rec.gdamMcp : rec.gdammcp;

        // Base Costs (excluding MCP)
        const traderMarginVal = Number(entry.traderMargin || 0);
        const marginGst = traderMarginVal * 0.18;
        
        const commonBaseCosts = 
          ctuCharge + // CTU
          stuCharge + // STU
          wheelingCharge + // Wheeling
          0.1 + // Other Charges
          0.02 + // Exchange Fees
          0.0036 + // GST on Exchange Fees
          cssRate + // Cross Subsidy
          addChargeRate; // Additional Surcharge

        // Additive Loss Multiplier
        const additiveLossMultiplier = 1 + (istsLoss / 100) + (stuLoss / 100) + (wheelingLoss / 100);

        const damLandingPrice = rawDam ? ((Number(rawDam) / 1000) + commonBaseCosts) * additiveLossMultiplier : 0;
        const rtmLandingPrice = rawRtm ? ((Number(rawRtm) / 1000) + commonBaseCosts) * additiveLossMultiplier : 0;
        const gdamLandingPrice = rawGdam ? ((Number(rawGdam) / 1000) + commonBaseCosts) * additiveLossMultiplier : 0;

        let comparedLowestPrice = discomLandingPrice;
        let selectedSource = 'DISCOM';
        
        let is1MWOrMore = false;
        if (matchedCustomSlot) {
          is1MWOrMore = (sanctionedLoad >= 1000);
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
          baseDiscomPrice,
          todPenaltyRebate,
          todChargePercent,
          baseEnergyRate,
          comparedLowestPrice,
          selectedSource,
          is1MWOrMore,
          maxEnergyPerSlot: 0,
          consumptionKwh: 0,
          todGroupKwh: 0,
          discomEnergy: 0,
          marketEnergy: 0,
          optimizedCost: 0,
          baselineCost: 0,
          istsLoss,
          stuLoss,
          wheelingLoss,
          expectedEnergy: 0,
          requiredEnergy: 0,
          bankedEnergy: 0,
          purchasedEnergy: 0,
          marketCost: 0,
          discomCost: 0
        };
      });

      // --- DAILY SLDC OPTIMIZATION ---
      const defaultMaxEnergyPerSlot = sanctionedLoad * 0.25;
      
      // Pre-calculate expected energy per slot based on actual consumption for accurate SLDC optimization
      monthlySlots.forEach(s => s.expectedEnergy = 0);
      for (const customSlot of customSlots) {
        const slotEnergyTotal = customSlot.consumptionKwh;
        const slotBlocks = monthlySlots.filter(s => s.customSlotId === customSlot.id || s.todSlab === (customSlot.name || `${customSlot.startTime}-${customSlot.endTime}`));
        const totalActiveBlocks = slotBlocks.length || 1;
        const energyPerBlock = slotEnergyTotal / totalActiveBlocks;
        slotBlocks.forEach(sb => {
          sb.expectedEnergy = Math.min(defaultMaxEnergyPerSlot, slotEnergyTotal);
        });
      }

      const slotsByDate = new Map<string, typeof monthlySlots>();
      monthlySlots.forEach(slot => {
        if (!slotsByDate.has(slot.date)) slotsByDate.set(slot.date, []);
        slotsByDate.get(slot.date)!.push(slot);
      });

      slotsByDate.forEach((dateSlots, date) => {
        const sampleSlot = dateSlots[0];
        if (!sampleSlot.customSlotId) return;

        const is1MWOrMore = sampleSlot.is1MWOrMore;
        const availableMarkets = is1MWOrMore ? ['DAM', 'RTM', 'GDAM'] : ['GDAM'];
        
        const calculateTotalCost = (markets: string[]) => {
          let energyCost = 0;
          let sldcCost = markets.length * sldcSchedulingFees;
          
          dateSlots.forEach(slot => {
            const maxEnergy = slot.expectedEnergy || 0;
            let bestCost = slot.discomLandingPrice * maxEnergy;
            
            markets.forEach(market => {
              let landingPrice = 0;
              if (market === 'DAM') landingPrice = slot.damLandingPrice;
              if (market === 'RTM') landingPrice = slot.rtmLandingPrice;
              if (market === 'GDAM') landingPrice = slot.gdamLandingPrice;
              
              if (landingPrice > 0 && landingPrice * maxEnergy < bestCost) {
                bestCost = landingPrice * maxEnergy;
              }
            });
            energyCost += bestCost;
          });
          
          return energyCost + sldcCost;
        };

        let combinations: string[][] = [];
        if (is1MWOrMore) {
          combinations = [['DAM'], ['RTM'], ['GDAM'], ['DAM', 'RTM'], ['DAM', 'GDAM'], ['RTM', 'GDAM'], ['DAM', 'RTM', 'GDAM']];
        } else {
          combinations = [['GDAM']];
        }

        let bestCombination: string[] = [];
        let lowestTotalCost = Infinity;

        let discomOnlyCost = 0;
        dateSlots.forEach(slot => {
          discomOnlyCost += slot.discomLandingPrice * (slot.expectedEnergy || 0);
        });
        lowestTotalCost = discomOnlyCost;

        combinations.forEach(combination => {
          const totalCost = calculateTotalCost(combination);
          if (totalCost < lowestTotalCost) {
            lowestTotalCost = totalCost;
            bestCombination = combination;
          }
        });

        dateSlots.forEach(slot => {
          let bestCost = slot.discomLandingPrice;
          let bestMarket = 'DISCOM';
          
          bestCombination.forEach(market => {
             let landingPrice = 0;
             if (market === 'DAM') landingPrice = slot.damLandingPrice;
             if (market === 'RTM') landingPrice = slot.rtmLandingPrice;
             if (market === 'GDAM') landingPrice = slot.gdamLandingPrice;
             
             if (landingPrice > 0 && landingPrice < bestCost) {
               bestCost = landingPrice;
               bestMarket = market;
             }
          });
          
          slot.selectedSource = bestMarket;
          slot.comparedLowestPrice = bestCost;
        });
      });
      // --- END DAILY SLDC OPTIMIZATION ---

      // Calculate Discom baseline cost and allocate energy across TOD windows (Greedy Chronological Banking Algorithm)

      for (const customSlot of customSlots) {
        const slotEnergyTotal = customSlot.consumptionKwh;
        const slotDiscomPrice = Number(customSlot.effectivePrice) > 0 ? Number(customSlot.effectivePrice) : 8.5;
        const slotName = customSlot.name || `${customSlot.startTime}-${customSlot.endTime}`;
        
        // Filter 15-minute timeblocks belonging to this custom TOD slot
        const slotBlocks = monthlySlots.filter(s => s.customSlotId === customSlot.id || s.todSlab === slotName);
        if (slotBlocks.length === 0) continue;

        // Sort chronologically
        slotBlocks.sort((a, b) => a.date.localeCompare(b.date) || a.timeblock - b.timeblock);
        
        const requiredEnergyPerSlot = slotEnergyTotal / slotBlocks.length;
        
        // Initialize requirements
        slotBlocks.forEach(sb => {
          sb.requiredEnergy = requiredEnergyPerSlot;
          sb.bankedEnergy = 0;
          sb.purchasedEnergy = 0;
          sb.marketEnergy = 0;
          sb.discomEnergy = 0;
          sb.marketCost = 0;
          sb.discomCost = 0;
          sb.baselineCost = requiredEnergyPerSlot * slotDiscomPrice;
          sb.consumptionKwh = requiredEnergyPerSlot;
        });

        // Sort by cheapest price for greedy buying
        const cheapToExpensive = [...slotBlocks].sort((a, b) => a.comparedLowestPrice - b.comparedLowestPrice);

        for (const buyerSlot of cheapToExpensive) {
           let availableCapacity = defaultMaxEnergyPerSlot - buyerSlot.purchasedEnergy;
           if (availableCapacity <= 0) continue;

           const buyerIndex = slotBlocks.indexOf(buyerSlot);

           // Forward Banking
           for (let i = buyerIndex; i < slotBlocks.length; i++) {
              const targetSlot = slotBlocks[i];
              const unmetRequirement = targetSlot.requiredEnergy - targetSlot.bankedEnergy - targetSlot.purchasedEnergy;
              
              if (unmetRequirement > 0) {
                  const amountToBuy = Math.min(availableCapacity, unmetRequirement);
                  if (amountToBuy > 0) {
                      buyerSlot.purchasedEnergy += amountToBuy;
                      availableCapacity -= amountToBuy;
                      
                      if (i === buyerIndex) {
                         targetSlot.purchasedEnergy += amountToBuy;
                      } else {
                         targetSlot.bankedEnergy += amountToBuy;
                      }
                      
                      const cost = amountToBuy * buyerSlot.comparedLowestPrice;
                      
                      if (buyerSlot.selectedSource !== 'DISCOM' && buyerSlot.comparedLowestPrice > 0) {
                          targetSlot.marketEnergy += amountToBuy;
                          targetSlot.marketCost += cost;
                      } else {
                          targetSlot.discomEnergy += amountToBuy;
                          targetSlot.discomCost += cost;
                      }
                  }
              }
              if (availableCapacity <= 0) break;
           }
        }

        // Unfulfilled Fallback & Aggregation
        let slotConsumptionKwh = 0;
        let slotMarketEnergyKwh = 0;
        let slotDiscomEnergyKwh = 0;
        let slotBaselineCost = 0;
        let slotMarketCost = 0;
        let slotDiscomCost = 0;

        slotBlocks.forEach(sb => {
           const unmet = sb.requiredEnergy - sb.bankedEnergy - sb.purchasedEnergy;
           if (unmet > 0) {
              sb.purchasedEnergy += unmet;
              const cost = unmet * sb.comparedLowestPrice;
              if (sb.selectedSource !== 'DISCOM' && sb.comparedLowestPrice > 0) {
                 sb.marketEnergy += unmet;
                 sb.marketCost += cost;
              } else {
                 sb.discomEnergy += unmet;
                 sb.discomCost += cost;
              }
           }
           
           sb.maxEnergyPerSlot = sb.requiredEnergy; // For compatibility with older reporting functions
           sb.optimizedCost = sb.marketCost + sb.discomCost;
           
           totalBaselineCost += sb.baselineCost;
           totalEnergyKwh += sb.requiredEnergy;
           totalMarketEnergyKwh += sb.marketEnergy;
           totalLandedExchangeCost += sb.marketCost;
           totalDiscomAfterProlt += sb.discomCost;

           slotConsumptionKwh += sb.requiredEnergy;
           slotMarketEnergyKwh += sb.marketEnergy;
           slotDiscomEnergyKwh += sb.discomEnergy;
           slotBaselineCost += sb.baselineCost;
           slotMarketCost += sb.marketCost;
           slotDiscomCost += sb.discomCost;
        });

        todSummaries.push({
          month: yearMonth,
          slotName: slotName,
          slabName: slotName,
          startTime: customSlot.startTime,
          endTime: customSlot.endTime,
          consumptionKwh: slotConsumptionKwh,
          totalEnergyKwh: slotConsumptionKwh,
          effectivePrice: slotDiscomPrice,
          baselineCost: slotBaselineCost,
          discomBill: slotBaselineCost,
          marketEnergyKwh: slotMarketEnergyKwh,
          oaUnits: slotMarketEnergyKwh,
          consumerBusUnits: slotMarketEnergyKwh,
          discomUnits: slotConsumptionKwh,
          marketCostBase: slotMarketCost,
          oaBill: slotMarketCost,
          proltDiscomBill: slotDiscomCost,
          savings: Math.max(0, slotBaselineCost - (slotMarketCost + slotDiscomCost))
        });

        aggregatedTotals.cssRate = cssRate;
        aggregatedTotals.cssCharge += slotMarketEnergyKwh * cssRate;
        aggregatedTotals.rpoCharge += slotMarketEnergyKwh * 0.25;
        aggregatedTotals.pocCharge += slotMarketEnergyKwh * ctuCharge;
        aggregatedTotals.stuCharge += slotMarketEnergyKwh * stuCharge;
        aggregatedTotals.dcCharge += slotMarketEnergyKwh * wheelingCharge;
        aggregatedTotals.iexFee += slotMarketEnergyKwh * 0.02;
      }

      // Calculate ED for the month
      let monthElectricityDuty = 0;
      let monthElectricityDutyAfterOA = 0;

      if (applyElectricityDuty) {
        const edRate = electricityDutyPercent / 100;
        
        let monthDiscomBill = 0;
        let monthDiscomAfterOABill = 0;
        
        monthlySlots.forEach(s => {
          monthDiscomBill += s.consumptionKwh * s.discomLandingPrice;
          monthDiscomAfterOABill += s.discomEnergy * s.discomLandingPrice;
        });
        
        monthElectricityDuty = monthDiscomBill * edRate;
        monthElectricityDutyAfterOA = monthDiscomAfterOABill * edRate;
      }

      totalElectricityDuty += monthElectricityDuty;
      totalElectricityDutyAfterOA += monthElectricityDutyAfterOA;
      totalBaselineCost += monthElectricityDuty;
      totalDiscomAfterProlt += monthElectricityDutyAfterOA;
      totalLandedExchangeCost += monthElectricityDutyAfterOA;

      slotsData.push(...monthlySlots);
    }

    // SLDC and NLDC cost calculated from total traded days using the first month's fees as default for the whole payload if multi-month
    // Note: We've now fetched iexFees inside the loop for the optimization, but for accumulated final totals, we'll re-fetch for the first month to set baseline fees for the accumulated tradedDays.
    const latestMonthToProcess = monthsToProcess[0]?.[0] || '';
    const [yS, mS] = latestMonthToProcess.split('-');
    const yyyymmVal = (parseInt(yS, 10) || 2026) * 100 + (parseInt(mS, 10) || 5);
    const iexFeesAccum = await prisma.iexFees.findFirst({ where: { month: yyyymmVal } });
    const nldcSchedulingFeesAccum = Number(iexFeesAccum?.nldcSchedulingFees || 20);
    const sldcSchedulingFeesAccum = Number(iexFeesAccum?.sldcSchedulingFees || 1500);

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

    const nldcSchedulingCost = nldcSchedulingFeesAccum * totalDaysTraded;
    const sldcSchedulingCost = sldcSchedulingFeesAccum * (totalDamDays + totalGdamDays + totalRtmDays);
    const dailyFixedOverhead = nldcSchedulingCost + sldcSchedulingCost;
    const bidApplicationFees = (totalDamDays + totalGdamDays + totalRtmDays) * 5;

    const proltMarginVal = Number(entry.proltMargin) || 0;
    const traderMarginVal = Number(entry.traderMargin) || 0;
    const consultancyFeeVal = Number(entry.consultancyFee) || 0;
    const platformFeeRate = entry.probusPlatformFee !== null && entry.probusPlatformFee !== undefined ? Number(entry.probusPlatformFee) : 0.02;
    const probusPlatformFeeVal = Math.round(totalMarketEnergyKwh * platformFeeRate);
    const meteringChargesVal = Number(entry.meteringCharges) || 0;

    const traderMarginCost = totalMarketEnergyKwh * traderMarginVal * 1.18;

    const meta = (entry.todConsumptions as any)?._meta || {};

    const applyEd = entry.applyElectricityDuty !== false;
    const edPercent = applyEd 
      ? ((entry as any).electricityDutyPercent !== undefined && (entry as any).electricityDutyPercent !== null 
          ? Number((entry as any).electricityDutyPercent) 
          : (meta.electricityDutyPercent !== undefined ? Number(meta.electricityDutyPercent) : 5))
      : 0;

    // FPPA % is brought directly from backend FppaCharges database table for the state/discom/months
    const fppaPercent = monthlyDbFppaCount > 0 
      ? (monthlyDbFppaSum / monthlyDbFppaCount)
      : ((entry as any).fppaChargePercent !== undefined && (entry as any).fppaChargePercent !== null && Number((entry as any).fppaChargePercent) > 0
          ? Number((entry as any).fppaChargePercent)
          : (meta.fppaChargePercent !== undefined && Number(meta.fppaChargePercent) > 0 ? Number(meta.fppaChargePercent) : 0));

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

    // Full baseline DISCOM cost including FPPA surcharge, Demand Charge, and Electricity Duty
    const fullBaselineDiscomCost = totalBaselineCost + fppaSurchargeVal + calculatedDemandCharge + electricityDutyVal;

    const oldOaSurcharges = aggregatedTotals.cssCharge + aggregatedTotals.rpoCharge + aggregatedTotals.pocCharge + aggregatedTotals.stuCharge + aggregatedTotals.dcCharge + aggregatedTotals.iexFee;
    
    // Full Open Access + Remaining DISCOM cost including FPPA, ED, Demand Charge, fees and overheads
    // Note: Most OA Surcharges (except RPO) and Trader Margin are ALREADY inside totalLandedExchangeCost
    // Note: meteringCharges are a one-time capital cost (used for payback period), not a monthly operating charge
    const baseOtherCosts = totalLandedExchangeCost + aggregatedTotals.rpoCharge + totalDiscomAfterProlt + fppaAfterOAVal + calculatedDemandCharge + electricityDutyAfterOAVal + consultancyFeeVal + probusPlatformFeeVal + dailyFixedOverhead + bidApplicationFees;

    // netSavings in the old calc is the savings BEFORE prolt margin and some platform fees, but AFTER trader margin
    const netSavings = fullBaselineDiscomCost - (totalLandedExchangeCost + aggregatedTotals.rpoCharge + totalDiscomAfterProlt + fppaAfterOAVal + calculatedDemandCharge + electricityDutyAfterOAVal + dailyFixedOverhead + bidApplicationFees);
    const grossSavings = Math.max(0, netSavings);

    const proltMarginInput = Number((entry as any).proltMargin || 0);
    const totalProltMarginCost = Math.round(grossSavings * (proltMarginInput / 100));
    const proltMarginCost = totalProltMarginCost;

    aggregatedTotals.proltMarginCost = proltMarginCost;
    aggregatedTotals.traderMargin = traderMarginCost;
    aggregatedTotals.consultancyFee = consultancyFeeVal;
    aggregatedTotals.probusPlatformFee = probusPlatformFeeVal;
    (aggregatedTotals as any).meteringCharges = meteringChargesVal;
    const nocFee = 7000;
    const regFee = 8333;
    (aggregatedTotals as any).grossSavings = grossSavings;
    (aggregatedTotals as any).nocFee = nocFee;
    (aggregatedTotals as any).regFee = regFee;

    totalOptimizedCost = baseOtherCosts + proltMarginCost;
    
    const totalSavings = Math.max(0, netSavings - nocFee - regFee - consultancyFeeVal - probusPlatformFeeVal - totalProltMarginCost - traderMarginCost);

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
      pureEnergyCost: totalBaselineCost,
      totalBaselineCost: fullBaselineDiscomCost,
      fullBaselineDiscomCost,
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

  static async calculateDemandShiftInsightsAllMonths(id: string, version?: number) {
    const entry = await this.getEntryOrVersion(id, version);
    if (!entry) throw new Error('Entry not found');

    const todConsumptions = entry.todConsumptions as Record<string, any> | null;
    if (!todConsumptions) throw new Error('No TOD consumption data found.');

    const months = Object.keys(todConsumptions).filter(m => !m.startsWith('_') && m.includes('-'));
    if (months.length === 0) throw new Error('No valid months found in todConsumptions.');

    let totalOriginalCost = 0;
    let totalNewCost = 0;
    let totalSavingsAchieved = 0;
    let totalShiftedEnergy = 0;
    const allSlotsData: any[] = [];
    const allTodShiftSummary: Record<string, any> = {};

    for (const month of months) {
      try {
        const res = await this.calculateDemandShiftInsights(id, month, version);
        totalOriginalCost += res.originalTotalCost;
        totalNewCost += res.newTotalCost;
        totalSavingsAchieved += res.savingsAchieved;
        totalShiftedEnergy += res.shiftedEnergy;
        allSlotsData.push(...res.slotsData);

        res.todShiftSummary.forEach((todData: any) => {
          const tod = todData.tod;
          if (!allTodShiftSummary[tod]) {
            allTodShiftSummary[tod] = { originalEnergy: 0, newEnergy: 0, diff: 0, originalMarketEnergy: 0, newMarketEnergy: 0 };
          }
          allTodShiftSummary[tod].originalEnergy += todData.originalEnergy;
          allTodShiftSummary[tod].newEnergy += todData.newEnergy;
          allTodShiftSummary[tod].originalMarketEnergy += todData.originalMarketEnergy;
          allTodShiftSummary[tod].newMarketEnergy += todData.newMarketEnergy;
          allTodShiftSummary[tod].diff += todData.diff;
        });
      } catch (e) {
        console.warn(`[SavingsCalculatorNewService] Failed to calculate demand shift for month ${month}:`, e);
      }
    }

    return {
      clientId: id,
      clientName: entry.clientName,
      originalTotalCost: totalOriginalCost,
      newTotalCost: totalNewCost,
      savingsAchieved: totalSavingsAchieved,
      shiftedEnergy: totalShiftedEnergy,
      todShiftSummary: Object.entries(allTodShiftSummary).map(([tod, data]) => ({ tod, ...data })),
      slotsData: allSlotsData
    };
  }

  static async calculateDemandShiftInsights(id: string, targetMonth?: string, version?: number) {
    if (targetMonth === 'all') {
      return this.calculateDemandShiftInsightsAllMonths(id, version);
    }
    const entry = await this.getEntryOrVersion(id, version);
    if (!entry) throw new Error('Entry not found');

    const marketResult = await this.calculateMarketDecision(id, targetMonth, version);
    const slotsData = marketResult.slotsData;

    const sanctionedLoadKw = entry.sanctionedLoadKw ? Number(entry.sanctionedLoadKw) : 100;
    const maxEnergyPerSlot = sanctionedLoadKw * 0.25;

    let originalTotalCost = 0;

    // Enhance slots with shifting metadata
    const shiftableSlots = slotsData.map((s: any, index: number) => {
      const costPerKwh = s.comparedLowestPrice;
      const originalMarketEnergy = s.marketEnergy || 0;
      const originalDiscomEnergy = s.discomEnergy || 0;
      const currentEnergy = originalMarketEnergy + originalDiscomEnergy;
      const headroom = Math.max(0, maxEnergyPerSlot - currentEnergy);
      originalTotalCost += (currentEnergy * costPerKwh);

      return {
        originalIndex: index,
        costPerKwh,
        currentEnergy,
        originalEnergy: currentEnergy,
        currentMarketEnergy: originalMarketEnergy,
        originalMarketEnergy,
        currentDiscomEnergy: originalDiscomEnergy,
        shouldBuyFromMarket: s.selectedSource !== 'DISCOM',
        headroom,
        date: s.date,
        timeblock: s.timeblock,
        tod: s.todSlab
      };
    });

    const expensiveSlots = [...shiftableSlots].sort((a, b) => b.costPerKwh - a.costPerKwh);
    const cheapSlots = [...shiftableSlots].sort((a, b) => a.costPerKwh - b.costPerKwh);

    let shiftedEnergy = 0;
    let savingsAchieved = 0;
    let expensiveIdx = 0;
    let cheapIdx = 0;

    while (expensiveIdx < expensiveSlots.length && cheapIdx < cheapSlots.length) {
      const expSlot = expensiveSlots[expensiveIdx];
      const cheapSlot = cheapSlots[cheapIdx];

      if (expSlot.costPerKwh <= cheapSlot.costPerKwh + 0.01) break;
      if (expSlot.currentEnergy <= 0) { expensiveIdx++; continue; }
      if (cheapSlot.headroom <= 0) { cheapIdx++; continue; }

      const amountToShift = Math.min(expSlot.currentEnergy, cheapSlot.headroom);
      expSlot.currentEnergy -= amountToShift;

      if (expSlot.currentDiscomEnergy >= amountToShift) {
        expSlot.currentDiscomEnergy -= amountToShift;
      } else {
        const remainingToRemove = amountToShift - expSlot.currentDiscomEnergy;
        expSlot.currentDiscomEnergy = 0;
        expSlot.currentMarketEnergy -= remainingToRemove;
      }

      cheapSlot.headroom -= amountToShift;
      cheapSlot.currentEnergy += amountToShift;
      if (cheapSlot.shouldBuyFromMarket) {
        cheapSlot.currentMarketEnergy += amountToShift;
      } else {
        cheapSlot.currentDiscomEnergy += amountToShift;
      }

      shiftedEnergy += amountToShift;
      savingsAchieved += amountToShift * (expSlot.costPerKwh - cheapSlot.costPerKwh);
    }

    let newTotalCost = 0;
    shiftableSlots.forEach((s: any) => { newTotalCost += (s.currentEnergy * s.costPerKwh); });

    const todShiftSummary: Record<string, any> = {};
    shiftableSlots.forEach((s: any) => {
      if (!todShiftSummary[s.tod]) {
        todShiftSummary[s.tod] = { originalEnergy: 0, newEnergy: 0, diff: 0, originalMarketEnergy: 0, newMarketEnergy: 0 };
      }
      todShiftSummary[s.tod].originalEnergy += s.originalEnergy;
      todShiftSummary[s.tod].newEnergy += s.currentEnergy;
      todShiftSummary[s.tod].originalMarketEnergy += s.originalMarketEnergy;
      todShiftSummary[s.tod].newMarketEnergy += s.currentMarketEnergy;
      todShiftSummary[s.tod].diff += (s.currentEnergy - s.originalEnergy);
    });

    return {
      clientId: id,
      clientName: entry.clientName,
      sanctionedLoadKw,
      maxEnergyPerSlot,
      originalTotalCost,
      newTotalCost,
      savingsAchieved,
      shiftedEnergy,
      todShiftSummary: Object.entries(todShiftSummary).map(([tod, data]) => ({ tod, ...data })),
      slotsData: shiftableSlots.map((s: any) => {
        const originalSlot = slotsData[s.originalIndex];
        return {
          date: s.date,
          timeblock: s.timeblock,
          tod: s.tod,
          originalEnergy: s.originalEnergy,
          newEnergy: s.currentEnergy,
          costPerKwh: s.costPerKwh,
          marketSource: originalSlot.selectedSource,
          shouldBuyFromMarket: s.shouldBuyFromMarket,
          marketEnergy: s.currentMarketEnergy,
          discomEnergy: s.currentDiscomEnergy,
          damMcp: originalSlot.damLandingPrice,
          rtmMcp: originalSlot.rtmLandingPrice,
          gdamMcp: originalSlot.gdamLandingPrice
        };
      })
    };
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
    let totalDiscomCost = 0;
    const monthsData = [];

    for (const month of months) {
      try {
        const result = await this.calculateMarketDecision(id, month);
        const netSavings = result.totalSavings;
        totalSavings += netSavings;
        totalDiscomCost += result.totalBaselineCost || 0;

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
      totalSavings,
      aggregatedCosts: {
        totalDiscomCost
      }
    };
  }

  static async getResourceDefaults(params: {
    stateCode?: string;
    discom?: string;
    consumerCategory?: string;
    voltageLevel?: string;
    monthStr?: string;
  }) {
    const { stateCode = 'MH', discom, consumerCategory = 'Industrial', monthStr = '2026-04' } = params;

    const stateMap: Record<string, string[]> = {
      'MH': ['MH', 'Maharashtra'],
      'GJ': ['GJ', 'Gujarat'],
      'KA': ['KA', 'Karnataka'],
      'TN': ['TN', 'Tamil Nadu'],
      'AP': ['AP', 'Andhra Pradesh'],
      'TS': ['TS', 'Telangana'],
      'DL': ['DL', 'Delhi'],
      'HR': ['HR', 'Haryana'],
      'PB': ['PB', 'Punjab'],
      'RJ': ['RJ', 'Rajasthan'],
      'UP': ['UP', 'Uttar Pradesh'],
      'MP': ['MP', 'Madhya Pradesh'],
      'CG': ['CG', 'Chhattisgarh'],
      'WB': ['WB', 'West Bengal'],
      'OD': ['OD', 'Odisha']
    };
    const stateFormats = stateMap[stateCode] || [stateCode];

    const [yStr, mStr] = (monthStr || '2026-04').split('-');
    const year = parseInt(yStr, 10) || 2026;
    const month = parseInt(mStr, 10) || 4;
    const yyyymm = year * 100 + month;
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;

    // 1. Query FPPA Charges
    let fppaChargePercent = 10.0;
    if (!isNaN(yyyymm)) {
      const fppaList = await prisma.fppaCharges.findMany({
        where: {
          state: { in: stateFormats },
          month: yyyymm
        }
      });
      let fppaData = discom ? fppaList.find(f => f.discom === discom) : undefined;
      if (!fppaData) {
        fppaData = fppaList.find(f => !f.discom || f.discom === '');
      }
      if (!fppaData && fppaList.length > 0) {
        fppaData = fppaList[0];
      }
      if (fppaData?.fppaChargePercent) {
        fppaChargePercent = Number(fppaData.fppaChargePercent);
      }
    }

    // 2. Query Demand Charge Rate from StateCharges
    let demandChargeKwRate = 250.0;
    const parsedCategory = consumerCategory?.toLowerCase().includes('ind') ? 'Industrial' : 'Commercial';
    const stateCharges = await prisma.stateCharges.findFirst({
      where: {
        state: { in: stateFormats },
        category: parsedCategory,
        fromDate: { lte: new Date(startStr) },
        toDate: { gte: new Date(startStr) }
      }
    });

    if (stateCharges?.demandFixedChargeKvaPerMonthRs) {
      demandChargeKwRate = Number(stateCharges.demandFixedChargeKvaPerMonthRs);
    }

    // 3. Electricity Duty
    let electricityDutyPercent = 5.0;

    return {
      fppaChargePercent,
      demandChargeKwRate,
      electricityDutyPercent
    };
  }
}
