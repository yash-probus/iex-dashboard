import prisma from '../../config/prisma';
import { getCache, setCache, invalidateCache } from '../../config/redis';

export function getFlooredMaxEnergyPerSlot(sanctionedLoadKw: any): number {
  const load = (sanctionedLoadKw && typeof sanctionedLoadKw.toNumber === 'function') 
    ? sanctionedLoadKw.toNumber() 
    : (Number(sanctionedLoadKw) || 0);
  if (load <= 0) return 0;
  // Convert 90% sanctioned load to Megawatts (MW)
  const rawMw = (load * 0.9) / 1000;
  // Market buying precision is restricted to 1 decimal place in MW (e.g. 1.35 MW -> 1.3 MW)
  const flooredMw = Math.floor(rawMw * 10 + 1e-9) / 10;
  const effectiveMw = flooredMw > 0 ? flooredMw : rawMw;
  // Maximum energy per 15-minute slot (in kWh) = MW * 1000 kW/MW * 0.25 hours
  return effectiveMw * 1000 * 0.25;
}

export class SavingsCalculatorService {
  static async getAll() {
    return prisma.savingsCalculatorEntry.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getById(id: string) {
    return prisma.savingsCalculatorEntry.findUnique({
      where: { id }
    });
  }


  static async getEntryOrVersion(id: string, version?: number) {
    if (version !== undefined) {
      const historyEntry = await prisma.savingsCalculatorEntryHistory.findFirst({
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
      const entry = await tx.savingsCalculatorEntry.create({
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

      await tx.savingsCalculatorEntryHistory.create({
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
          meteringCharges: (entry as any).meteringCharges,
          consultancyFee: entry.consultancyFee,
          probusPlatformFee: entry.probusPlatformFee,
          todConsumptions: entry.todConsumptions ? (entry.todConsumptions as any) : undefined,
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
      const entry = await tx.savingsCalculatorEntry.update({
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

      // Find highest version
      const lastHistory = await tx.savingsCalculatorEntryHistory.findFirst({
        where: { entryId: id },
        orderBy: { version: 'desc' }
      });
      const nextVersion = lastHistory ? lastHistory.version + 1 : 1;

      await tx.savingsCalculatorEntryHistory.create({
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
          meteringCharges: (entry as any).meteringCharges,
          consultancyFee: entry.consultancyFee,
          probusPlatformFee: entry.probusPlatformFee,
          todConsumptions: entry.todConsumptions ? (entry.todConsumptions as any) : undefined,
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

      await invalidateCache(`market:${id}:*`);
      await invalidateCache(`demandshift:${id}:*`);
      await invalidateCache(`calc:savings:${id}:*`);

      return entry;
    });
  }

  static async delete(id: string) {
    const res = await prisma.savingsCalculatorEntry.delete({
      where: { id }
    });
    await invalidateCache(`market:${id}:*`);
    await invalidateCache(`demandshift:${id}:*`);
    await invalidateCache(`calc:savings:${id}:*`);
    return res;
  }

  static async getHistory(id: string) {
    return prisma.savingsCalculatorEntryHistory.findMany({
      where: { entryId: id },
      orderBy: { version: 'desc' }
    });
  }

  static async getClientOverview(id: string) {
    const entry = await prisma.savingsCalculatorEntry.findUnique({
      where: { id }
    });

    if (!entry) {
      throw new Error('Entry not found');
    }

    const todConsumptions = entry.todConsumptions as Record<string, Record<string, number | string>> | null;
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
    const aggregatedCosts = {
      cssCharge: 0,
      rpoCharge: 0,
      pocCharge: 0,
      stuCharge: 0,
      dcCharge: 0,
      iexFee: 0,
      traderMarginTotal: 0,
      dailyFixedOverhead: 0,
      bidApplicationFees: 0,
      proltMarginCost: 0,
      consultancyFee: 0,
      probusPlatformFee: 0,
      totalDiscomCost: 0,
      energyCharges: 0,
      demandAndFixedCharges: 0,
      penaltiesAndAdjustments: 0,
      miscellaneousCharges: 0,
      peakDemand: 0,
      demandChargeRate: 0
    };

    for (const month of months) {
      try {
        const result = await SavingsCalculatorService.calculateMarketDecision(id, month);
        const netSavings = result.totalSavings;
        const grossSavings = netSavings + (result.oaDetailed?.totals?.proltMarginCost || 0);

        aggregatedCosts.cssCharge += result.oaDetailed?.totals?.cssCharge || 0;
        aggregatedCosts.rpoCharge += result.oaDetailed?.totals?.rpoCharge || 0;
        aggregatedCosts.pocCharge += result.oaDetailed?.totals?.pocCharge || 0;
        aggregatedCosts.stuCharge += result.oaDetailed?.totals?.stuCharge || 0;
        aggregatedCosts.dcCharge += result.oaDetailed?.totals?.dcCharge || 0;
        aggregatedCosts.iexFee += result.oaDetailed?.totals?.iexFee || 0;
        aggregatedCosts.traderMarginTotal += (result.oaDetailed?.totals?.traderMargin || 0) + (result.oaDetailed?.totals?.traderMarginGst || 0);
        aggregatedCosts.dailyFixedOverhead += result.oaDetailed?.dailyFixedOverhead || 0;
        aggregatedCosts.bidApplicationFees += result.oaDetailed?.bidApplicationFees || 0;
        aggregatedCosts.proltMarginCost += result.oaDetailed?.totals?.proltMarginCost || 0;
        aggregatedCosts.consultancyFee += (result.oaDetailed?.totals as any)?.consultancyFee || 0;
        aggregatedCosts.probusPlatformFee += (result.oaDetailed?.totals as any)?.probusPlatformFee || 0;

        aggregatedCosts.totalDiscomCost += result.totalBaselineCost || 0;
        aggregatedCosts.demandAndFixedCharges += result.demandCharge || 0;
        aggregatedCosts.miscellaneousCharges += (result.electricityDuty || 0) + (result.miscellaneousCharges || 0);
        aggregatedCosts.energyCharges += ((result.totalBaselineCost || 0) - (result.demandCharge || 0) - (result.electricityDuty || 0) - (result.miscellaneousCharges || 0));
        aggregatedCosts.peakDemand = Math.max(aggregatedCosts.peakDemand, result.peakDemand || 0);
        aggregatedCosts.demandChargeRate = result.demandChargeRate || aggregatedCosts.demandChargeRate;

        totalSavings += netSavings;

        const consumerBusUnits = (result.oaDetailed?.totals as any)?.consumerBusUnits ?? (result.totalMarketEnergyKwh * (1 - 0.1211));
        monthsData.push({
          month,
          savings: netSavings,
          grossSavings: grossSavings,
          totalEnergyKwh: result.totalEnergyKwh,
          totalMarketEnergyKwh: result.totalMarketEnergyKwh,
          oaConsumer: consumerBusUnits,
          oaCoverage: result.totalEnergyKwh ? (consumerBusUnits / result.totalEnergyKwh) * 100 : 0,
          proltMarginCost: result.oaDetailed?.totals?.proltMarginCost || 0,
          traderMargin: (result.oaDetailed?.totals?.traderMargin || 0) + (result.oaDetailed?.totals?.traderMarginGst || 0),
          consultancyFee: (result.oaDetailed?.totals as any)?.consultancyFee || 0,
          probusPlatformFee: (result.oaDetailed?.totals as any)?.probusPlatformFee || 0,
          totalBaselineCost: result.totalBaselineCost || 0,
          totalOptimizedCost: (result.totalBaselineCost || 0) - (result.totalSavings || 0)
        });
      } catch (error) {
        console.error(`Error calculating market decision for month ${month}:`, error);
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
      totalSavings,
      aggregatedCosts
    };
  }

  static async calculateMarketDecisionAllMonths(id: string, version?: number, useShiftedProfile: boolean = false, shiftInsights?: any) {
    const entry = await this.getEntryOrVersion(id, version);
    if (!entry) throw new Error('Entry not found');
    const todConsumptions = entry.todConsumptions as any;
    if (!todConsumptions) throw new Error('No consumption data found');

    const months = Object.keys(todConsumptions).sort();
    let totalSavings = 0;
    let totalBaselineCost = 0;
    let totalEnergyKwh = 0;
    let totalMarketEnergyKwh = 0;
    let totalLandedExchangeCost = 0;
    let totalDiscomAfterProlt = 0;
    let demandCharge = 0;
    let electricityDuty = 0;
    let peakDemand = 0;
    let demandChargeRate = 0;

    const aggregatedTotals = {
      cssCharge: 0, cssRate: 0, rpoCharge: 0, pocCharge: 0, stuCharge: 0,
      dcCharge: 0, iexFee: 0, traderMargin: 0, traderMarginGst: 0, proltMarginCost: 0,
      consultancyFee: 0, probusPlatformFee: 0
    };
    let aggregatedDailyOverhead = 0;
    let aggregatedNldc = 0;
    let aggregatedSldc = 0;
    let aggregatedBidFees = 0;
    let aggregatedTotalDaysTraded = 0;

    for (const month of months) {
      try {
        const res = await this.calculateMarketDecision(id, month, version, useShiftedProfile, shiftInsights);
        if (res) {
          totalSavings += res.totalSavings;
          totalBaselineCost += res.totalBaselineCost;
          totalEnergyKwh += res.totalEnergyKwh;
          totalMarketEnergyKwh += res.totalMarketEnergyKwh;
          totalLandedExchangeCost += res.totalLandedExchangeCost;
          totalDiscomAfterProlt += res.totalDiscomAfterProlt;
          demandCharge += res.demandCharge;
          electricityDuty += res.electricityDuty;
          peakDemand = Math.max(peakDemand, (res as any).peakDemand || 0);
          demandChargeRate = (res as any).demandChargeRate || demandChargeRate;

          if (res.oaDetailed) {
            const t = res.oaDetailed.totals;
            aggregatedTotals.cssCharge += t.cssCharge;
            aggregatedTotals.rpoCharge += t.rpoCharge;
            aggregatedTotals.pocCharge += t.pocCharge;
            aggregatedTotals.stuCharge += t.stuCharge;
            aggregatedTotals.dcCharge += t.dcCharge;
            aggregatedTotals.iexFee += t.iexFee;
            aggregatedTotals.traderMargin += t.traderMargin;
            aggregatedTotals.traderMarginGst += t.traderMarginGst;
            aggregatedTotals.proltMarginCost += t.proltMarginCost;
            aggregatedTotals.consultancyFee += (t as any).consultancyFee || 0;
            aggregatedTotals.probusPlatformFee += (t as any).probusPlatformFee || 0;
            (aggregatedTotals as any).nocFee = 7000;
            (aggregatedTotals as any).regFee = 8333;

            aggregatedDailyOverhead += res.oaDetailed.dailyFixedOverhead;
            aggregatedNldc += res.oaDetailed.nldcSchedulingCost;
            aggregatedSldc += res.oaDetailed.sldcSchedulingCost;
            aggregatedBidFees += res.oaDetailed.bidApplicationFees;
            aggregatedTotalDaysTraded += res.oaDetailed.totalDaysTraded;
          }
        }
      } catch (e) {
        console.error("Error calculating month", month, e);
      }
    }

    return {
      clientId: entry.id,
      clientName: entry.clientName,
      slotsData: [],
      totalEnergyKwh,
      totalMarketEnergyKwh,
      totalBaselineCost,
      totalLandedExchangeCost,
      totalDiscomAfterProlt,
      totalSavings,
      demandCharge,
      electricityDuty,
      arrearAmount: entry.arrearAmount ? Number(entry.arrearAmount) : 0,
      currentLpsc: entry.currentLpsc ? Number(entry.currentLpsc) : 0,
      discom: entry.discom,
      peakDemand,
      demandChargeRate,
      todSummaries: [],
      oaDetailed: {
        breakdown: [],
        dailyFixedOverhead: aggregatedDailyOverhead,
        nldcSchedulingCost: aggregatedNldc,
        sldcSchedulingCost: aggregatedSldc,
        bidApplicationFees: aggregatedBidFees,
        totalDaysTraded: aggregatedTotalDaysTraded,
        totals: aggregatedTotals
      }
    };
  }

  static async calculateSavingsAllMonths(id: string, version?: number, useShiftedProfile: boolean = false, shiftInsights?: any) {
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
        const res = await this.calculateSavings(id, month, version, useShiftedProfile, shiftInsights);
        if (res) {
          totalSavings += res.totalSavings;
          totalOptimizedCost += res.totalOptimizedCost;
          totalBaselineCost += res.totalBaselineCost;
          totalEnergyKwh += res.totalEnergyKwh;
          totalMarketEnergyKwh += res.totalMarketEnergyKwh;
        }
      } catch (e) {
        console.error("Error calculating month", month, e);
      }
    }

    return {
      clientId: entry.id,
      clientName: entry.clientName,
      sanctionedLoad: Number(entry.sanctionedLoadKw) || 0,
      maxEnergyPerSlot: getFlooredMaxEnergyPerSlot(entry.sanctionedLoadKw),
      totalEnergyKwh,
      totalMarketEnergyKwh,
      totalBaselineCost,
      totalOptimizedCost,
      totalSavings,
      todGroups: {},
      sortedMonthlyList: []
    };
  }

  // Savings calculation logic
  static async calculateSavings(id: string, targetMonth?: string, version?: number, useShiftedProfile: boolean = false, shiftInsights?: any) {
    if (targetMonth === 'all') {
      return this.calculateSavingsAllMonths(id, version, useShiftedProfile, shiftInsights);
    }
    const entry = await this.getEntryOrVersion(id, version);
    if (!entry) {
      throw new Error('Entry not found');
    }

    let insights = shiftInsights;
    if (useShiftedProfile && !insights) {
      insights = await this.calculateDemandShiftInsights(id, targetMonth, version);
    }

    const category = entry.consumerCategory || 'Industrial';
    if (category.startsWith('HV-1') && category !== 'HV-1 A' && category !== 'HV-1 B') {
      return this.calculateSavingsHV1(entry, targetMonth, insights);
    }
    return this.calculateSavingsHV2(entry, targetMonth, insights);
  }

  static async calculateSavingsHV1(entry: any, targetMonth?: string, shiftInsights?: any) {
    return this.calculateSavingsHV2(entry, targetMonth, shiftInsights);
  }

  static async calculateSavingsHV2(entry: any, targetMonth?: string, shiftInsights?: any) {
    const id = entry.id;
    const stateCode = entry.stateCode || 'MH';
    const sanctionedLoad = entry.sanctionedLoadKw ? Number(entry.sanctionedLoadKw) : 100;
    const category = entry.consumerCategory || 'Industrial';
    const rawVoltage = entry.voltageLevel || '11 kV';

    // 15-minute slot energy limit in kWh = load (kW) * 0.25 hours (restricted to 1 decimal place in MW)
    const maxEnergyPerSlot = getFlooredMaxEnergyPerSlot(sanctionedLoad);

    const todConsumptions = entry.todConsumptions as Record<string, Record<string, number | string>> | null;
    if (!todConsumptions || Object.keys(todConsumptions).length === 0) {
      throw new Error("No TOD consumption data found. Please edit the entry and provide consumption data.");
    }

    let allSlotsData: any[] = [];
    let totalBaselineCost = 0;
    let totalOptimizedCost = 0;
    let totalEnergyKwh = 0;
    let totalMarketEnergyKwh = 0;

    let monthsToProcess = Object.entries(todConsumptions);
    if (targetMonth) {
      monthsToProcess = monthsToProcess.filter(([ym]) => ym === targetMonth);
      if (monthsToProcess.length === 0) {
        throw new Error(`No consumption data found for month ${targetMonth}`);
      }
    }

    // Process each configured month
    for (const [yearMonth, monthConsumptions] of monthsToProcess) {
      const [yearStr, monthStr] = yearMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      // Bill month is the next calendar month
      const nextMonthDate = new Date(year, month, 1);
      const nextYear = nextMonthDate.getFullYear();
      const nextMonth = nextMonthDate.getMonth() + 1;
      const yyyymmMonth = nextYear * 100 + nextMonth;
      const calendarMonth = year * 100 + month;

      // FPPA month is 1 month prior to the calendar month (e.g. Jan FPPA for Feb)
      const prevMonthDate = new Date(year, month - 2, 1);
      const prevYear = prevMonthDate.getFullYear();
      const prevMonthVal = prevMonthDate.getMonth() + 1;
      const fppaQueryMonth = prevYear * 100 + prevMonthVal;

      if (isNaN(year) || isNaN(month) || isNaN(yyyymmMonth)) {
        throw new Error(`Invalid consumption month format: ${yearMonth}. Expected YYYY-MM.`);
      }

      let stateName = entry.stateCode || stateCode;
      if (stateName) {
        const rs = await prisma.regionState.findFirst({ where: { stateCode: stateName } });
        if (rs && rs.stateName) {
          stateName = rs.stateName;
        }
      }

      let parsedSupplyVoltageCategory = entry.voltageLevel || rawVoltage;
      if (parsedSupplyVoltageCategory.includes(' - ')) {
        parsedSupplyVoltageCategory = parsedSupplyVoltageCategory.split(' - ')[0];
      }

      let parsedCategory = category;
      let parsedSubCategory = undefined;
      if (category.includes(' | ')) {
        const parts = category.split(' | ');
        parsedCategory = parts[0];
        parsedSubCategory = parts[1];
      } else {
        if (category === 'HV-1 A') {
          parsedCategory = 'HV-1';
          parsedSubCategory = 'Commercial, Private Inst';
        } else if (category === 'HV-1 B') {
          parsedCategory = 'HV-1';
          parsedSubCategory = 'Public Inst., Societies';
        } else if (category === 'LMV-11 (Multistoried Buildings)') {
          parsedCategory = 'LMV-11';
          parsedSubCategory = 'Multistoried Buildings';
        } else if (category === 'LMV-11 (Public Charging)') {
          parsedCategory = 'LMV-11';
          parsedSubCategory = 'Public Charging';
        }
      }

      const stateFormats = [stateName, stateName.toUpperCase(), stateName.toUpperCase().replace(/\s+/g, '_'), stateName.charAt(0).toUpperCase() + stateName.slice(1).toLowerCase()];

      const effectiveYyyymmMonth = nextYear * 100 + nextMonth;

      let startDayInput = monthConsumptions['Start Date'];
      let endDayInput = monthConsumptions['End Date'];

      let startDay = 1;
      if (startDayInput) {
        if (typeof startDayInput === 'string' && startDayInput.includes('-')) {
          const parts = startDayInput.split('-');
          startDay = Number(parts[parts.length - 1]);
        } else {
          startDay = Number(startDayInput);
        }
      } else {
        startDay = entry.discom === 'NPCL' ? 19 : 1;
      }
      if (isNaN(startDay)) {
        startDay = entry.discom === 'NPCL' ? 19 : 1;
      }

      let endDay = 0;
      if (endDayInput) {
        if (typeof endDayInput === 'string' && endDayInput.includes('-')) {
          const parts = endDayInput.split('-');
          endDay = Number(parts[parts.length - 1]);
        } else {
          endDay = Number(endDayInput);
        }
      } else {
        endDay = entry.discom === 'NPCL' ? 18 : 0;
      }
      if (isNaN(endDay)) {
        endDay = entry.discom === 'NPCL' ? 18 : 0;
      }

      let startStr = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;

      let endYear = year;
      let endMonth = month;

      if (endDay === 0) {
        let lastDay = new Date(year, month, 0).getDate();
        endDay = lastDay;
      } else if (endDay <= startDay) {
        // move to next month
        const nextMonthDate = new Date(year, month, endDay);
        endYear = nextMonthDate.getFullYear();
        endMonth = nextMonthDate.getMonth() + 1;
      }

      const maxDays = new Date(endYear, endMonth, 0).getDate();
      if (endDay > maxDays) {
        endDay = maxDays;
      }

      let endStr = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

      // Fetch stateCharges for losses
      const stateCharges = await prisma.stateCharges.findFirst({
        where: {
          state: { in: stateFormats },
          discom: entry.discom === 'NPCL' ? 'NPCL' : null,
          category: parsedCategory,
          fromDate: { lte: new Date(startStr) },
          toDate: { gte: new Date(startStr) }
        }
      });
      const stuLoss = stateCharges?.stuLossPercent ? Number(stateCharges.stuLossPercent) : 0;
      const wheelingLoss = stateCharges?.wheelingLossPercent ? Number(stateCharges.wheelingLossPercent) : 0;

      // Fetch istsCharges for losses
      const istsCharges = await prisma.istsCharges.findMany({
        where: {
          OR: [
            { startDate: { lte: new Date(endStr) }, endDate: { gte: new Date(startStr) } }
          ]
        }
      });

      // Fetch FPPA percent (using current month for simulation accuracy)
      const fppaDataList = await prisma.fppaCharges.findMany({
        where: {
          state: { in: stateFormats },
          month: yyyymmMonth
        }
      });
      let fppaData = fppaDataList.find(f => f.discom === entry.discom);
      if (!fppaData) {
        fppaData = fppaDataList.find(f => !f.discom || f.discom === '');
      }
      const fppaPercent = fppaData?.fppaChargePercent ? Number(fppaData.fppaChargePercent) : 0;
      const monthsInPlay: number[] = [];
      const startD = new Date(startStr);
      const endD = new Date(endStr);
      if (!isNaN(startD.getTime()) && !isNaN(endD.getTime())) {
        const cur = new Date(startD.getFullYear(), startD.getMonth(), 1);
        const limit = new Date(endD.getFullYear(), endD.getMonth(), 1);
        while (cur <= limit) {
          monthsInPlay.push(cur.getFullYear() * 100 + (cur.getMonth() + 1));
          cur.setMonth(cur.getMonth() + 1);
        }
      }
      if (monthsInPlay.length === 0) {
        monthsInPlay.push(effectiveYyyymmMonth);
      }

      const whereClause: any = {
        state: { in: stateFormats },
        discom: entry.discom === 'NPCL' ? 'NPCL' : null,
        consumerCategory: parsedCategory,
        supplyVoltageCategory: parsedSupplyVoltageCategory,
        OR: [
          { consumptionMonth: { in: monthsInPlay } },
          { month: { in: monthsInPlay }, consumptionMonth: null }
        ]
      };
      if (parsedSubCategory) {
        whereClause.subCategory = { contains: parsedSubCategory };
      }

      // Fetch matching StateTariff slabs from DB
      let tariffs = await prisma.stateTariff.findMany({
        where: whereClause
      });

      if (tariffs.length === 0) {
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
          if (latestTariff.consumptionMonth) {
            whereClause.consumptionMonth = latestTariff.consumptionMonth;
            tariffs = allTariffs.filter(t => t.consumptionMonth === latestTariff.consumptionMonth);
          } else {
            whereClause.month = latestTariff.month;
            tariffs = allTariffs.filter(t => t.month === latestTariff.month);
          }
        }
      }

      // Query combined DAM, GDAM, and RTM records for the selected month using FULL OUTER JOIN

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

      const records: any[] = await prisma.$queryRawUnsafe(query);

      // Parse TOD ranges helper
      const parseHour = (val: string | null | undefined): number => {
        if (!val) return 0;
        if (val.includes(':')) {
          return parseInt(val.split(':')[0], 10);
        }
        return parseInt(val, 10);
      };

      // Construct the flat monthly slots array
      const slotsData = records.map(rec => {
        const deliveryDate = rec.date ? new Date(rec.date) : new Date(startStr);
        const dateStr = deliveryDate.toISOString().split('T')[0];
        const slot = rec.timeblock || rec.timeblock === 0 ? Number(rec.timeblock) : 1;

        let istsLoss = 0;
        const matchingIsts = istsCharges.find(i => deliveryDate >= i.startDate && deliveryDate <= i.endDate);
        if (matchingIsts) {
          istsLoss = Number(matchingIsts.istsLossPercent || 0);
        }

        const startMinutes = (slot - 1) * 15;
        const hour = Math.floor(startMinutes / 60);
        const minute = startMinutes % 60;
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        const rawDam = rec.damMcp !== undefined ? rec.damMcp : rec.dammcp;
        const rawRtm = rec.rtmMcp !== undefined ? rec.rtmMcp : rec.rtmmcp;
        const rawGdam = rec.gdamMcp !== undefined ? rec.gdamMcp : rec.gdammcp;

        const damLandingPrice = rawDam ? (Number(rawDam) / 1000) : 0;
        const rtmLandingPrice = rawRtm ? (Number(rawRtm) / 1000) : 0;
        const gdamLandingPrice = rawGdam ? (Number(rawGdam) / 1000) : 0;

        let discomLandingPrice = 7.5;
        let matchedTariffName = 'normal';

        const isNpcl = entry.discom === 'NPCL';
        const isNpclHv2 = isNpcl && parsedCategory === 'HV-2';

        if (isNpclHv2) {
          const slotMonth = deliveryDate.getMonth() + 1;
          const isWinter = slotMonth >= 9 || slotMonth <= 3;
          const baseRate = 6.80;

          if (isWinter) {
            // TOD1 [22:00 - 04:00] -> Rate 5.78 (-15%)
            // TOD2 [04:00 - 06:00] -> Rate 6.80 (0%)
            // TOD3 [06:00 - 10:00] -> Rate 7.82 (+15%)
            // TOD4 [10:00 - 17:00] -> Rate 6.80 (0%)
            // TOD6 [17:00 - 19:00] -> Rate 7.82 (+15%)
            // TOD5 [19:00 - 22:00] -> Rate 6.80 (0%)
            if (hour >= 22 || hour < 4) {
              matchedTariffName = 'TOD1';
              discomLandingPrice = baseRate * 0.85;
            } else if (hour >= 4 && hour < 6) {
              matchedTariffName = 'TOD2';
              discomLandingPrice = baseRate;
            } else if (hour >= 6 && hour < 10) {
              matchedTariffName = 'TOD3';
              discomLandingPrice = baseRate * 1.15;
            } else if (hour >= 10 && hour < 17) {
              matchedTariffName = 'TOD4';
              discomLandingPrice = baseRate;
            } else if (hour >= 17 && hour < 19) {
              matchedTariffName = 'TOD6';
              discomLandingPrice = baseRate * 1.15;
            } else if (hour >= 19 && hour < 22) {
              matchedTariffName = 'TOD5';
              discomLandingPrice = baseRate;
            }
          } else {
            // Summer (April to September)
            // TOD4 [07:00 - 16:00] -> Rate 5.78 (-15%)
            // TOD1 [16:00 - 19:00] -> Rate 6.80 (0%)
            // TOD2 [19:00 - 02:00] -> Rate 7.82 (+15%)
            // TOD3 [02:00 - 07:00] -> Rate 6.80 (0%)
            if (hour >= 7 && hour < 16) {
              matchedTariffName = 'TOD4';
              discomLandingPrice = baseRate * 0.85;
            } else if (hour >= 16 && hour < 19) {
              matchedTariffName = 'TOD1';
              discomLandingPrice = baseRate;
            } else if (hour >= 19 || hour < 2) {
              matchedTariffName = 'TOD2';
              discomLandingPrice = baseRate * 1.15;
            } else if (hour >= 2 && hour < 7) {
              matchedTariffName = 'TOD3';
              discomLandingPrice = baseRate;
            }
          }
        } else if (tariffs.length > 0) {
          const slotMonth = deliveryDate.getFullYear() * 100 + (deliveryDate.getMonth() + 1);
          let tariffsForMonth = tariffs.filter(t => t.month === slotMonth);
          if (tariffsForMonth.length === 0) {
            tariffsForMonth = tariffs;
          }

          let matched = tariffsForMonth.find(t => {
            if (!t.todStartTime || t.todStartTime === '—' || !t.todEndTime || t.todEndTime === '—') {
              return false;
            }
            const start = parseHour(t.todStartTime);
            const end = parseHour(t.todEndTime);
            if (start <= end) {
              return hour >= start && hour < end;
            } else {
              return hour >= start || hour < end;
            }
          });

          if (!matched) {
            matched = tariffsForMonth.find(t => !t.todStartTime || t.todStartTime === '—' || !t.todEndTime || t.todEndTime === '—');
          }

          if (matched) {
            discomLandingPrice = Number(matched.energyRate || matched.baseEnergyRate || 7.5);
            matchedTariffName = (matched.todStartTime !== '—' && matched.todEndTime !== '—')
              ? `${matched.todStartTime}-${matched.todEndTime}`.toUpperCase()
              : 'FLAT';
          }
        } else {
          if (hour >= 22 || hour < 6) {
            discomLandingPrice = 6.0;
            matchedTariffName = 'offpeak';
          } else if (hour >= 18 && hour < 22) {
            discomLandingPrice = 8.5;
            matchedTariffName = 'peak';
          }
        }

        discomLandingPrice = discomLandingPrice * (1 + (fppaPercent / 100));

        if (entry.discom === 'NPCL') {
          discomLandingPrice = discomLandingPrice * 0.90 * 0.99;
        }

        let comparedLowestPrice = discomLandingPrice;
        let selectedSource = 'DISCOM';

        // Source 100% from Open Access if available, regardless of whether it's cheaper than DISCOM
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

        return {
          date: dateStr,
          slot,
          timeStr,
          todSlab: matchedTariffName,
          damLandingPrice,
          rtmLandingPrice,
          gdamLandingPrice,
          discomLandingPrice,
          comparedLowestPrice,
          selectedSource,
          maxEnergyPerSlot: 0,
          optimizedCost: 0,
          baselineCost: 0,
          istsLoss,
          stuLoss,
          wheelingLoss
        };
      });

      const todCounts: Record<string, number> = {};
      slotsData.forEach(item => {
        let groupKey = item.todSlab.toUpperCase();
        todCounts[groupKey] = (todCounts[groupKey] || 0) + 1;
      });

      // Pass 2: Greedy Optimization per TOD Slab
      // 1. Group slots by TOD slab
      const slotsByTod: Record<string, any[]> = {};
      slotsData.forEach(item => {
        let groupKey = item.todSlab.toUpperCase();
        if (!slotsByTod[groupKey]) slotsByTod[groupKey] = [];
        slotsByTod[groupKey].push(item);
      });

      // 2. Iterate through each TOD slab and allocate energy

      Object.keys(slotsByTod).forEach(groupKey => {
        // Find the total energy requirement for this TOD slab from the input
        let remainingEnergy = 0;
        
        if (shiftInsights) {
          const todSummary = shiftInsights.todShiftSummary.find((t: any) => t.tod === groupKey);
          remainingEnergy = todSummary ? todSummary.newEnergy : 0;
        } else {
          const matchedKey = Object.keys(monthConsumptions).find(k => {
            if (k.toLowerCase().includes('peak demand') || k.toLowerCase().includes('sanctioned')) return false;
            return k.toUpperCase().includes(groupKey) || k.toUpperCase() === groupKey;
          });

          if (matchedKey && monthConsumptions[matchedKey] !== undefined && monthConsumptions[matchedKey] !== null && monthConsumptions[matchedKey] !== '') {
            remainingEnergy = Number(monthConsumptions[matchedKey]);
          } else {
            const metadataKeys = ['power factor', 'electricity duty', 'peak demand (kva)', 'start date', 'end date', 'arrears', 'lpsc', 'miscellaneous charges'];
            const flatKey = Object.keys(monthConsumptions).find(k => k.toUpperCase() === 'FLAT' || k.toUpperCase() === 'TOTAL');
            let flatTotal = 0;
            if (flatKey && monthConsumptions[flatKey] !== undefined && monthConsumptions[flatKey] !== null && monthConsumptions[flatKey] !== '') {
              flatTotal = Number(monthConsumptions[flatKey]);
            } else {
              for (const [k, v] of Object.entries(monthConsumptions)) {
                if (v !== null && v !== '' && !metadataKeys.includes(k.toLowerCase())) {
                  const numVal = Number(v);
                  if (!isNaN(numVal)) {
                    flatTotal += numVal;
                  }
                }
              }
            }
            if (flatTotal > 0) {
              const totalSlotsInMonth = slotsData.length;
              remainingEnergy = flatTotal * (slotsByTod[groupKey].length / totalSlotsInMonth);
            }
          }
        }

        // Add the baseline cost for this TOD slab (if they bought it all from DISCOM)
        // Note: we can just add this up per slot, but since DISCOM price is constant per TOD slab,
        // we can assign it to the slots or just keep track globally.
        // To keep the UI reporting happy, we will distribute baselineCost across slots.

        const totalSlotsInTod = slotsByTod[groupKey].length;
        const energyPerSlot = totalSlotsInTod > 0 ? remainingEnergy / totalSlotsInTod : 0;

        slotsByTod[groupKey].forEach(slot => {
          slot.maxEnergyPerSlot = energyPerSlot;
          slot.optimizedCost = energyPerSlot * slot.comparedLowestPrice;
          slot.baselineCost = energyPerSlot * slot.discomLandingPrice;
        });
      });

      slotsData.forEach(item => {
        totalOptimizedCost += item.optimizedCost;
        totalBaselineCost += item.baselineCost;
        totalEnergyKwh += item.maxEnergyPerSlot;
        if (item.selectedSource !== 'DISCOM') {
          totalMarketEnergyKwh += item.maxEnergyPerSlot;
        }
      });

      allSlotsData.push(...slotsData);
    } // End of month loop

    const totalSavings = totalBaselineCost - totalOptimizedCost;

    // Group all combined slots for UI reporting
    const groups: { [key: string]: any[] } = {};
    allSlotsData.forEach(item => {
      let groupKey = item.todSlab.toUpperCase();
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    const sortedGroups: { [key: string]: any[] } = {};
    Object.keys(groups).forEach(key => {
      sortedGroups[key] = [...groups[key]].sort((a, b) => a.comparedLowestPrice - b.comparedLowestPrice);
    });

    const sortedMonthlyList = [...allSlotsData].sort((a, b) => a.comparedLowestPrice - b.comparedLowestPrice);

    return {
      clientId: id,
      clientName: entry.clientName,
      sanctionedLoad,
      maxEnergyPerSlot,
      totalEnergyKwh,
      totalMarketEnergyKwh,
      totalBaselineCost,
      totalOptimizedCost,
      totalSavings,
      todGroups: sortedGroups,
      sortedMonthlyList
    };
  }

  static async calculateMarketDecision(id: string, targetMonthStr?: string, version?: number, useShiftedProfile: boolean = false, shiftInsights?: any) {
    if (targetMonthStr === 'all') {
      return this.calculateMarketDecisionAllMonths(id, version, useShiftedProfile, shiftInsights);
    }
    const cacheVersion = version !== undefined ? version : 'live';
    const cacheKey = `market:${id}:v:${cacheVersion}:m:${targetMonthStr || 'default'}`;
    const cached = await getCache(cacheKey);
    if (cached && false) {
      return cached;
    }
    const entry = await this.getEntryOrVersion(id, version);

    if (!entry) {
      throw new Error('Savings calculator entry not found');
    }
    if (!entry.stateCode) {
      throw new Error('State is required to calculate savings. Please edit this entry to select a state.');
    }

    if (useShiftedProfile && !shiftInsights) {
      shiftInsights = await this.calculateDemandShiftInsights(id, targetMonthStr, version);
    }

    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;
    if (targetMonthStr) {
      const parts = targetMonthStr.split('-');
      if (parts.length === 2) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
      }
    }

    // Bill month is the next calendar month
    const nextMonthDate = new Date(year, month, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = nextMonthDate.getMonth() + 1;
    const yyyymmMonth = nextYear * 100 + nextMonth;
    const calendarMonth = year * 100 + month;

    // FPPA month is 1 month prior to the calendar month (e.g. Jan FPPA for Feb)
    const prevMonthDate = new Date(year, month - 2, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonthVal = prevMonthDate.getMonth() + 1;
    const fppaQueryMonth = prevYear * 100 + prevMonthVal;
    const stateCode = entry.stateCode || '';
    const category = entry.consumerCategory || '';
    const voltageLevel = entry.voltageLevel || '';
    let stateName = stateCode;
    if (stateCode) {
      const rs = await prisma.regionState.findFirst({ where: { stateCode } });
      if (rs && rs.stateName) {
        stateName = rs.stateName;
      }
    }

    const stateFormats = [stateName, stateName.toUpperCase(), stateName.toUpperCase().replace(/\s+/g, '_'), stateName.charAt(0).toUpperCase() + stateName.slice(1).toLowerCase()];

    const traderMargin = Number(entry.traderMargin || 0);
    const sanctionedLoad = Number(entry.sanctionedLoadKw) || 0;
    const maxEnergyPerSlot = getFlooredMaxEnergyPerSlot(sanctionedLoad);

    const monthKey = targetMonthStr || `${year}-${String(month % 100).padStart(2, '0')}`;
    const monthConsumptions = (entry.todConsumptions as Record<string, Record<string, number | string>> | null)?.[monthKey] || {};

    const monthArrear = monthConsumptions['Arrear Amount'] !== undefined && monthConsumptions['Arrear Amount'] !== null
      ? Number(monthConsumptions['Arrear Amount'])
      : (entry.arrearAmount ? Number(entry.arrearAmount) : 0);

    const monthLpsc = monthConsumptions['Current LPSC'] !== undefined && monthConsumptions['Current LPSC'] !== null
      ? Number(monthConsumptions['Current LPSC'])
      : (entry.currentLpsc ? Number(entry.currentLpsc) : 0);

    const monthMisc = monthConsumptions['Miscellaneous Charges'] !== undefined && monthConsumptions['Miscellaneous Charges'] !== null
      ? Number(monthConsumptions['Miscellaneous Charges'])
      : 0;

    let startDayInput = monthConsumptions['Start Date'];
    let endDayInput = monthConsumptions['End Date'];

    let startDay = 1;
    if (startDayInput) {
      if (typeof startDayInput === 'string' && startDayInput.includes('-')) {
        const parts = startDayInput.split('-');
        startDay = Number(parts[parts.length - 1]);
      } else {
        startDay = Number(startDayInput);
      }
    } else {
      startDay = entry.discom === 'NPCL' ? 19 : 1;
    }
    if (isNaN(startDay)) {
      startDay = entry.discom === 'NPCL' ? 19 : 1;
    }

    let endDay = 0;
    if (endDayInput) {
      if (typeof endDayInput === 'string' && endDayInput.includes('-')) {
        const parts = endDayInput.split('-');
        endDay = Number(parts[parts.length - 1]);
      } else {
        endDay = Number(endDayInput);
      }
    } else {
      endDay = entry.discom === 'NPCL' ? 18 : 0;
    }
    if (isNaN(endDay)) {
      endDay = entry.discom === 'NPCL' ? 18 : 0;
    }

    let startStr = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;

    let endYear = year;
    let endMonth = month;

    if (endDay === 0) {
      let lastDay = new Date(year, month, 0).getDate();
      endDay = lastDay;
    } else if (endDay <= startDay) {
      const nextMonthDate = new Date(year, month, endDay);
      endYear = nextMonthDate.getFullYear();
      endMonth = nextMonthDate.getMonth() + 1;
    }

    const maxDays = new Date(endYear, endMonth, 0).getDate();
    if (endDay > maxDays) {
      endDay = maxDays;
    }

    let endStr = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;


    let parsedSupplyVoltageCategory = voltageLevel;
    if (parsedSupplyVoltageCategory.includes(' - ')) {
      parsedSupplyVoltageCategory = parsedSupplyVoltageCategory.split(' - ')[0];
    }

    let parsedCategory = category;
    let parsedSubCategory = undefined;
    if (category.includes(' | ')) {
      const parts = category.split(' | ');
      parsedCategory = parts[0];
      parsedSubCategory = parts[1];
    } else {
      if (category === 'HV-1 A') {
        parsedCategory = 'HV-1';
        parsedSubCategory = 'Commercial, Private Inst';
      } else if (category === 'HV-1 B') {
        parsedCategory = 'HV-1';
        parsedSubCategory = 'Public Inst., Societies';
      } else if (category === 'LMV-11 (Multistoried Buildings)') {
        parsedCategory = 'LMV-11';
        parsedSubCategory = 'Multistoried Buildings';
      } else if (category === 'LMV-11 (Public Charging)') {
        parsedCategory = 'LMV-11';
        parsedSubCategory = 'Public Charging';
      }
    }

    const stateCharges = await prisma.stateCharges.findFirst({
      where: {
        state: { in: stateFormats },
        discom: entry.discom === 'NPCL' ? 'NPCL' : null,
        category: parsedCategory,
        fromDate: { lte: new Date(startStr) },
        toDate: { gte: new Date(startStr) },
        // StateCharges uses the full string (e.g. '33' or '0.433') so we might need the second part if available
        // But for now, we will just use voltageLevel since it was '0.433' in DB. Or we can just omit it if it fails.
        // Let's omit voltageLevel for now to avoid false negatives since StateCharges has different voltage formatting.
      }
    });

    console.log('[StateCharges Query Debug] State Formats:', stateFormats);
    console.log('[StateCharges Query Debug] Category:', category);
    console.log('[StateCharges Query Debug] Date Range:', startStr, 'to', endStr);
    console.log('[StateCharges Query Debug] Found:', !!stateCharges);
    if (stateCharges) {
      console.log('[StateCharges Query Debug] Cross Subsidy:', stateCharges.crossSubsidy);
      console.log('[StateCharges Query Debug] STU Charges:', stateCharges.stuCharges);
      console.log('[StateCharges Query Debug] Valid From:', stateCharges.fromDate);
      console.log('[StateCharges Query Debug] Valid To:', stateCharges.toDate);
    } else {
      console.log('[StateCharges Query Debug] ERROR: No matching state charges record found!');
    }

    const ctuCharges = await prisma.ctuCharges.findFirst({
      where: { month: yyyymmMonth }
    });

    const istsCharges = await prisma.istsCharges.findMany({
      where: {
        OR: [
          { startDate: { lte: new Date(endStr) }, endDate: { gte: new Date(startStr) } }
        ]
      }
    });

    const iexFees = await prisma.iexFees.findFirst({
      where: { month: yyyymmMonth }
    });

    const effectiveYyyymmMonth = nextYear * 100 + nextMonth;
    const monthsInPlay: number[] = [];
    const startD = new Date(startStr);
    const endD = new Date(endStr);
    if (!isNaN(startD.getTime()) && !isNaN(endD.getTime())) {
      const cur = new Date(startD.getFullYear(), startD.getMonth(), 1);
      const limit = new Date(endD.getFullYear(), endD.getMonth(), 1);
      while (cur <= limit) {
        monthsInPlay.push(cur.getFullYear() * 100 + (cur.getMonth() + 1));
        cur.setMonth(cur.getMonth() + 1);
      }
    }
    if (monthsInPlay.length === 0) {
      monthsInPlay.push(effectiveYyyymmMonth);
    }

    const whereClauseTariff: any = {
      state: { in: stateFormats },
      discom: entry.discom === 'NPCL' ? 'NPCL' : null,
      consumerCategory: parsedCategory,
      supplyVoltageCategory: parsedSupplyVoltageCategory,
      OR: [
        { consumptionMonth: { in: monthsInPlay } },
        { month: { in: monthsInPlay }, consumptionMonth: null }
      ]
    };
    if (parsedSubCategory) {
      whereClauseTariff.subCategory = { contains: parsedSubCategory };
    }
    let tariffs = await prisma.stateTariff.findMany({ where: whereClauseTariff });

    if (tariffs.length === 0) {
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
        if (latestTariff.consumptionMonth) {
          whereClauseTariff.consumptionMonth = latestTariff.consumptionMonth;
          tariffs = allTariffs.filter(t => t.consumptionMonth === latestTariff.consumptionMonth);
        } else {
          whereClauseTariff.month = latestTariff.month;
          tariffs = allTariffs.filter(t => t.month === latestTariff.month);
        }
      }
    }

    const EXCHANGE_FEES = 0.02;
    const GST_EXCHANGE = 0;
    const OTHER_CHARGES = 0.1;
    const TRADER_MARGIN = traderMargin;
    const GST_TRADER_MARGIN = 0;
    const RPO_FLAT_RATE = 0.25;
    const NLDC_APPLICATION_FEE_PER_BID = 5;

    const nldcSchedulingFees = Number(iexFees?.nldcSchedulingFees || 0);
    const sldcSchedulingFees = Number(iexFees?.sldcSchedulingFees || 0);

    if (!ctuCharges) {
      throw new Error(`CTU Charges not found for month ${month}`);
    }
    if (!stateCharges) {
      throw new Error(`State Charges not found for state ${stateCode}, category ${category}, voltage ${voltageLevel}, date ${startStr}`);
    }

    if (ctuCharges.ctu_charges_rs_per_kwh == null) throw new Error('CTU Charges value is missing.');
    if (stateCharges.stuCharges == null) throw new Error('STU Charges value is missing.');
    if (stateCharges.distributionWheelingCharges == null) throw new Error('Distribution/Wheeling Charges value is missing.');
    if (stateCharges.crossSubsidy == null) throw new Error('Cross Subsidy value is missing.');
    if (stateCharges.additionalCharge == null) throw new Error('Additional Surcharge value is missing.');
    if (stateCharges.stuLossPercent == null) throw new Error('STU Loss Percent value is missing.');
    if (stateCharges.wheelingLossPercent == null) throw new Error('Wheeling Loss Percent value is missing.');

    // Fetch FPPA percent (using current month for simulation accuracy)
    const fppaDataList = await prisma.fppaCharges.findMany({
      where: {
        state: { in: stateFormats },
        month: yyyymmMonth
      }
    });
    let fppaData = fppaDataList.find(f => f.discom === entry.discom);
    if (!fppaData) {
      fppaData = fppaDataList.find(f => !f.discom || f.discom === '');
    }
    if (!fppaData && fppaDataList.length > 0) {
      fppaData = fppaDataList[0];
    }
    const fppaPercent = fppaData?.fppaChargePercent ? Number(fppaData.fppaChargePercent) : 0;

    const ctuCharge = Number(ctuCharges.ctu_charges_rs_per_kwh);
    const stuCharge = Number(stateCharges.stuCharges);
    const wheelingCharge = Number(stateCharges.distributionWheelingCharges);
    const crossSubsidy = Number(stateCharges.crossSubsidy);
    const additionalSurcharge = Number(stateCharges.additionalCharge);
    const stuLoss = Number(stateCharges.stuLossPercent);
    const wheelingLoss = Number(stateCharges.wheelingLossPercent);

    console.log('[Charge Values Debug] crossSubsidy from DB:', crossSubsidy);
    console.log('[Charge Values Debug] stuCharge from DB:', stuCharge);

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
    const records: any[] = await prisma.$queryRawUnsafe(query);

    const parseHour = (val: string | null | undefined): number => {
      if (!val) return 0;
      if (val.includes(':')) {
        return parseInt(val.split(':')[0], 10);
      }
      return parseInt(val, 10);
    };

    // monthKey and monthConsumptions are declared earlier

    const slotsData = records.map(rec => {
      const deliveryDate = rec.date ? new Date(rec.date) : new Date(startStr);
      const slot = rec.timeblock || rec.timeblock === 0 ? Number(rec.timeblock) : 1;
      const startMinutes = (slot - 1) * 15;
      const hour = Math.floor(startMinutes / 60);

      let istsLoss = 0;
      const matchingIsts = istsCharges.find(i => deliveryDate >= i.startDate && deliveryDate <= i.endDate);
      if (matchingIsts) {
        istsLoss = Number(matchingIsts.istsLossPercent || 0);
      }

      const damMcp = (rec.damMcp != null) ? (Number(rec.damMcp) / 1000) : null;
      const rtmMcp = (rec.rtmMcp != null) ? (Number(rec.rtmMcp) / 1000) : null;
      const gdamMcp = (rec.gdamMcp != null) ? (Number(rec.gdamMcp) / 1000) : null;

      const calcExchangeLanding = (mcp: number | null) => {
        if (mcp == null) return null;
        const safeIsts = Math.min(istsLoss, 99.9);
        const safeStu = Math.min(stuLoss, 99.9);
        const safeWheeling = Math.min(wheelingLoss, 99.9);
        const lossCoefficient = (1 - (safeIsts / 100)) * (1 - (safeStu / 100)) * (1 - (safeWheeling / 100));
        const regionalCharges = mcp + ctuCharge + stuCharge + wheelingCharge + OTHER_CHARGES + EXCHANGE_FEES + GST_EXCHANGE + TRADER_MARGIN + GST_TRADER_MARGIN + additionalSurcharge;
        const lossAdjustedRegional = regionalCharges / lossCoefficient;
        return lossAdjustedRegional + crossSubsidy;
      };

      const damLanding = calcExchangeLanding(damMcp);
      const rtmLanding = calcExchangeLanding(rtmMcp);
      const gdamLanding = calcExchangeLanding(gdamMcp);

      let marketPrices = [damLanding, rtmLanding, gdamLanding].filter(p => p !== null) as number[];
      if (sanctionedLoad < 1000) {
        marketPrices = [gdamLanding].filter(p => p !== null) as number[];
      }

      const bestMarketLanding = marketPrices.length > 0 ? Math.min(...marketPrices) : 0;

      let marketSource = 'GDAM'; // Default to GDAM if below 1MW
      if (sanctionedLoad >= 1000) {
        if (bestMarketLanding === damLanding) marketSource = 'DAM';
        if (bestMarketLanding === rtmLanding) marketSource = 'RTM';
      }
      if (bestMarketLanding === gdamLanding) marketSource = 'GDAM';

      // Store all market landing prices for later SLDC optimization
      const marketLandings = {
        DAM: sanctionedLoad >= 1000 ? damLanding : null,
        RTM: sanctionedLoad >= 1000 ? rtmLanding : null,
        GDAM: gdamLanding
      };

      let discomBase = 7.5;
      let matchedTariffName = 'normal';

      const isNpcl = entry.discom === 'NPCL';
      const isNpclHv2 = isNpcl && parsedCategory === 'HV-2';

      if (isNpclHv2) {
        const slotMonth = deliveryDate.getMonth() + 1;
        const isWinter = slotMonth >= 9 || slotMonth <= 3;
        const baseRate = 6.80;

        if (isWinter) {
          if (hour >= 22 || hour < 4) {
            matchedTariffName = 'TOD1';
            discomBase = baseRate * 0.85;
          } else if (hour >= 4 && hour < 6) {
            matchedTariffName = 'TOD2';
            discomBase = baseRate;
          } else if (hour >= 6 && hour < 10) {
            matchedTariffName = 'TOD3';
            discomBase = baseRate * 1.15;
          } else if (hour >= 10 && hour < 17) {
            matchedTariffName = 'TOD4';
            discomBase = baseRate;
          } else if (hour >= 17 && hour < 19) {
            matchedTariffName = 'TOD6';
            discomBase = baseRate * 1.15;
          } else if (hour >= 19 && hour < 22) {
            matchedTariffName = 'TOD5';
            discomBase = baseRate;
          }
        } else {
          if (hour >= 7 && hour < 16) {
            matchedTariffName = 'TOD4';
            discomBase = baseRate * 0.85;
          } else if (hour >= 16 && hour < 19) {
            matchedTariffName = 'TOD1';
            discomBase = baseRate;
          } else if (hour >= 19 || hour < 2) {
            matchedTariffName = 'TOD2';
            discomBase = baseRate * 1.15;
          } else if (hour >= 2 && hour < 7) {
            matchedTariffName = 'TOD3';
            discomBase = baseRate;
          }
        }
      } else if (tariffs.length > 0) {
        const slotMonth = deliveryDate.getFullYear() * 100 + (deliveryDate.getMonth() + 1);
        let tariffsForMonth = tariffs.filter(t => t.month === slotMonth);
        if (tariffsForMonth.length === 0) {
          tariffsForMonth = tariffs;
        }

        let matched = tariffsForMonth.find(t => {
          if (!t.todStartTime || t.todStartTime === '—' || !t.todEndTime || t.todEndTime === '—') {
            return false;
          }
          const start = parseHour(t.todStartTime);
          const end = parseHour(t.todEndTime);
          if (start <= end) return hour >= start && hour < end;
          return hour >= start || hour < end;
        });

        if (!matched) {
          matched = tariffsForMonth.find(t => !t.todStartTime || t.todStartTime === '—' || !t.todEndTime || t.todEndTime === '—');
        }

        if (matched) {
          discomBase = Number(matched.energyRate || matched.baseEnergyRate || 7.5);
          matchedTariffName = (matched.todStartTime !== '—' && matched.todEndTime !== '—')
            ? `${matched.todStartTime}-${matched.todEndTime}`.toUpperCase()
            : 'FLAT';
        }
      }

      let discomLanding = discomBase * (1 + (fppaPercent / 100));
      if (isNpcl) {
        discomLanding = discomLanding * 0.90 * 0.99;
      }

      const shouldBuyFromMarket = bestMarketLanding > 0 && bestMarketLanding < discomLanding;

      return {
        date: deliveryDate.toISOString().split('T')[0],
        timeblock: slot,
        hour,
        tod: matchedTariffName,
        damMcp, rtmMcp, gdamMcp,
        damLanding, rtmLanding, gdamLanding,
        bestMarketLanding,
        marketSource,
        discomLanding,
        shouldBuyFromMarket,
        savingsPerKwh: discomLanding - bestMarketLanding,
        istsLoss,
        stuLoss,
        wheelingLoss,
        marketLandings
      };
    });

    // ── SLDC-Aware Market Optimization ──────────────
    // Optimize market selection per date to minimize total cost including SLDC overhead
    const sldcFeePerMarketPerDay = sldcSchedulingFees; // ₹1500 per market per day

    // Group slots by date
    const slotsByDate = new Map<string, typeof slotsData>();
    slotsData.forEach(slot => {
      if (!slotsByDate.has(slot.date)) {
        slotsByDate.set(slot.date, []);
      }
      slotsByDate.get(slot.date)!.push(slot);
    });

    // For each date, optimize market selection considering SLDC costs
    slotsByDate.forEach((dateSlots, date) => {
      const marketableSlots = dateSlots.filter(s => s.shouldBuyFromMarket);
      if (marketableSlots.length === 0) return;

      // Calculate total energy cost for each market option
      const marketCosts = {
        DAM: 0,
        RTM: 0,
        GDAM: 0
      };

      const marketCounts = {
        DAM: 0,
        RTM: 0,
        GDAM: 0
      };

      marketableSlots.forEach(slot => {
        const maxEnergy = maxEnergyPerSlot;
        if (slot.marketLandings.DAM && slot.marketLandings.DAM < slot.discomLanding) {
          marketCosts.DAM += slot.marketLandings.DAM * maxEnergy;
          marketCounts.DAM++;
        }
        if (slot.marketLandings.RTM && slot.marketLandings.RTM < slot.discomLanding) {
          marketCosts.RTM += slot.marketLandings.RTM * maxEnergy;
          marketCounts.RTM++;
        }
        if (slot.marketLandings.GDAM && slot.marketLandings.GDAM < slot.discomLanding) {
          marketCosts.GDAM += slot.marketLandings.GDAM * maxEnergy;
          marketCounts.GDAM++;
        }
      });

      // Calculate total cost including SLDC for each market combination
      const calculateTotalCost = (markets: string[]) => {
        let energyCost = 0;
        let sldcCost = markets.length * sldcFeePerMarketPerDay;

        marketableSlots.forEach(slot => {
          const maxEnergy = maxEnergyPerSlot;
          let bestCost = slot.discomLanding * maxEnergy; // Default to DISCOM


          markets.forEach(market => {
            const landing = slot.marketLandings[market as keyof typeof slot.marketLandings];
            if (landing && landing < bestCost) {
              bestCost = landing * maxEnergy;
            }
          });

          energyCost += bestCost;
        });

        return energyCost + sldcCost;
      };

      // Evaluate different market combinations
      const combinations = [
        ['DAM'],
        ['RTM'],
        ['GDAM'],
        ['DAM', 'RTM'],
        ['DAM', 'GDAM'],
        ['RTM', 'GDAM'],
        ['DAM', 'RTM', 'GDAM']
      ];

      let bestCombination = ['DAM'];
      let lowestTotalCost = Infinity;

      combinations.forEach(combination => {
        const totalCost = calculateTotalCost(combination);
        if (totalCost < lowestTotalCost) {
          lowestTotalCost = totalCost;
          bestCombination = combination;
        }
      });

      console.log(`[SLDC Optimization] Date ${date}: Best markets = ${bestCombination.join(', ')}, Total cost = ${lowestTotalCost.toFixed(2)}`);

      // Reassign markets based on optimal combination
      marketableSlots.forEach(slot => {
        const maxEnergy = maxEnergyPerSlot;
        let bestCost = slot.discomLanding * maxEnergy;
        let bestMarket = null;

        bestCombination.forEach(market => {
          const landing = slot.marketLandings[market as keyof typeof slot.marketLandings];
          if (landing && landing < bestCost) {
            bestCost = landing * maxEnergy;
            bestMarket = market;
          }
        });

        if (bestMarket) {
          slot.marketSource = bestMarket;
          const landing = slot.marketLandings[bestMarket as keyof typeof slot.marketLandings];
          slot.bestMarketLanding = landing || slot.discomLanding;
        } else {
          slot.shouldBuyFromMarket = false;
          slot.marketSource = 'DISCOM';
        }
      });
    });

    // ── RTM Contiguity Optimization ──────────────
    for (let i = 0; i < slotsData.length; i++) {
      const slot = slotsData[i];
      if (slot.marketSource === 'RTM' && slot.shouldBuyFromMarket) {
        const prevSlot = i > 0 ? slotsData[i - 1] : null;
        const nextSlot = i < slotsData.length - 1 ? slotsData[i + 1] : null;

        const prevIsRTM = prevSlot?.marketSource === 'RTM' && prevSlot?.shouldBuyFromMarket;
        const nextIsRTM = nextSlot?.marketSource === 'RTM' && nextSlot?.shouldBuyFromMarket;

        if (!prevIsRTM && !nextIsRTM) {
          // Isolated RTM slot

          // Option 1: Downgrade this slot
          const altPrices = [slot.damLanding, slot.gdamLanding].filter(p => p !== null && p > 0) as number[];
          const bestAltLanding = altPrices.length > 0 ? Math.min(...altPrices) : slot.discomLanding;

          let downgradePenalty = Infinity;
          let newDowngradeSource = 'DAM';
          let newDowngradeShouldBuy = false;

          if (bestAltLanding < slot.discomLanding) {
            downgradePenalty = bestAltLanding - (slot.rtmLanding as number);
            newDowngradeSource = bestAltLanding === slot.damLanding ? 'DAM' : 'GDAM';
            newDowngradeShouldBuy = true;
          } else {
            downgradePenalty = slot.discomLanding - (slot.rtmLanding as number);
            newDowngradeSource = 'DAM';
            newDowngradeShouldBuy = false;
          }

          // Option 2: Upgrade prev slot
          let upgradePrevPenalty = Infinity;
          if (prevSlot && prevSlot.rtmLanding && prevSlot.rtmLanding > 0) {
            const currentCost = prevSlot.shouldBuyFromMarket ? prevSlot.bestMarketLanding : prevSlot.discomLanding;
            upgradePrevPenalty = prevSlot.rtmLanding - currentCost;
          }

          // Option 3: Upgrade next slot
          let upgradeNextPenalty = Infinity;
          if (nextSlot && nextSlot.rtmLanding && nextSlot.rtmLanding > 0) {
            const currentCost = nextSlot.shouldBuyFromMarket ? nextSlot.bestMarketLanding : nextSlot.discomLanding;
            upgradeNextPenalty = nextSlot.rtmLanding - currentCost;
          }

          const minPenalty = Math.min(downgradePenalty, upgradePrevPenalty, upgradeNextPenalty);

          if (minPenalty === downgradePenalty) {
            slot.marketSource = newDowngradeSource;
            slot.bestMarketLanding = newDowngradeShouldBuy ? bestAltLanding : 0;
            slot.shouldBuyFromMarket = newDowngradeShouldBuy;
            slot.savingsPerKwh = newDowngradeShouldBuy ? slot.discomLanding - bestAltLanding : 0;
          } else if (minPenalty === upgradePrevPenalty && prevSlot) {
            prevSlot.marketSource = 'RTM';
            prevSlot.bestMarketLanding = (prevSlot.rtmLanding as number);
            prevSlot.shouldBuyFromMarket = true;
            prevSlot.savingsPerKwh = prevSlot.discomLanding - (prevSlot.rtmLanding as number);
          } else if (minPenalty === upgradeNextPenalty && nextSlot) {
            nextSlot.marketSource = 'RTM';
            nextSlot.bestMarketLanding = (nextSlot.rtmLanding as number);
            nextSlot.shouldBuyFromMarket = true;
            nextSlot.savingsPerKwh = nextSlot.discomLanding - (nextSlot.rtmLanding as number);
          }
        }
      }
    }

    // ── Aggregate financials using TOD consumption from the entry ──────────────
    // Correct approach:
    // 1. Baseline = Σ slab: consumption × DISCOM_rate (no market slot distribution needed)
    // 2. Exchange cost = Σ slab: (market-cheaper-fraction × consumption × avg_market_price)
    //                           + (DISCOM-fraction × consumption × DISCOM_rate)
    // This avoids dilution errors from uneven market slot counts.

    // === PASS 1: Allocate Market Energy per TOD Slab (Forward Banking) ===
    let peakDemand = entry.billedDemandKv ? Number(entry.billedDemandKv) : 0;
    if (peakDemand === 0) {
      Object.keys(monthConsumptions).forEach(k => {
        if (k.toLowerCase().includes('peak demand') || k.toLowerCase().includes('sanctioned')) {
          peakDemand = Math.max(peakDemand, Number(monthConsumptions[k]) || 0);
        }
      });
    }

    const demandChargeRate = stateCharges ? Number(stateCharges.demandFixedChargeKvaPerMonthRs || 0) : 0;
    const demandCharge = peakDemand * demandChargeRate;
    const slotsByTod: Record<string, typeof slotsData> = {};

    slotsData.forEach(s => {
      const key = s.tod.toUpperCase();
      if (!slotsByTod[key]) slotsByTod[key] = [];
      slotsByTod[key].push(s);
    });

    let preTotalEnergyKwh = 0;
    Object.keys(slotsByTod).forEach(groupKey => {
      let slabConsumption = 0;
      
      if (shiftInsights) {
        const todSummary = shiftInsights.todShiftSummary.find((t: any) => t.tod === groupKey);
        slabConsumption = todSummary ? todSummary.newEnergy : 0;
      } else {
        const matchedKey = Object.keys(monthConsumptions).find(k => {
          if (k.toLowerCase().includes('peak demand') || k.toLowerCase().includes('sanctioned')) return false;
          return k.toUpperCase().includes(groupKey) || k.toUpperCase() === groupKey;
        });
        
        if (matchedKey && monthConsumptions[matchedKey] !== undefined && monthConsumptions[matchedKey] !== null && monthConsumptions[matchedKey] !== '') {
          slabConsumption = Number(monthConsumptions[matchedKey]);
        } else {
          const metadataKeys = ['power factor', 'electricity duty', 'peak demand (kva)', 'start date', 'end date', 'arrears', 'lpsc', 'miscellaneous charges'];
          const flatKey = Object.keys(monthConsumptions).find(k => k.toUpperCase() === 'FLAT' || k.toUpperCase() === 'TOTAL');
          let flatTotal = 0;
          if (flatKey && monthConsumptions[flatKey] !== undefined && monthConsumptions[flatKey] !== null && monthConsumptions[flatKey] !== '') {
            flatTotal = Number(monthConsumptions[flatKey]);
          } else {
            for (const [k, v] of Object.entries(monthConsumptions)) {
              if (v !== null && v !== '' && !metadataKeys.includes(k.toLowerCase())) {
                const numVal = Number(v);
                if (!isNaN(numVal)) {
                  flatTotal += numVal;
                }
              }
            }
          }
          if (flatTotal > 0) {
            const totalSlotsInMonth = slotsData.length;
            slabConsumption = flatTotal * (slotsByTod[groupKey].length / totalSlotsInMonth);
          }
        }
      }
      preTotalEnergyKwh += slabConsumption;
    });

    Object.keys(slotsByTod).forEach(groupKey => {
      const slotsInGroup = slotsByTod[groupKey];
      let slabConsumption = 0;
      
      if (shiftInsights) {
        const todSummary = shiftInsights.todShiftSummary.find((t: any) => t.tod === groupKey);
        slabConsumption = todSummary ? todSummary.newEnergy : 0;
        
        if (slabConsumption <= 0) return;
        
        slotsInGroup.forEach(s => {
          const shiftSlot = shiftInsights.slotsData.find((ss: any) => ss.date === s.date && ss.timeblock === s.timeblock);
          if (shiftSlot) {
            (s as any).marketEnergy = shiftSlot.marketEnergy || 0;
            (s as any).consumedMarketEnergy = shiftSlot.marketEnergy || 0;
            (s as any).discomEnergy = shiftSlot.discomEnergy || 0;
            let basePrice = 0;
            if (s.marketSource === 'DAM') basePrice = s.damMcp || 0;
            else if (s.marketSource === 'RTM') basePrice = s.rtmMcp || 0;
            else if (s.marketSource === 'GDAM') basePrice = s.gdamMcp || 0;
            (s as any).exactMarketEnergyCost = (shiftSlot.marketEnergy || 0) * basePrice;
          }
        });
      } else {
        const matchedKey = Object.keys(monthConsumptions).find(k => {
          if (k.toLowerCase().includes('peak demand') || k.toLowerCase().includes('sanctioned')) return false;
          return k.toUpperCase().includes(groupKey) || k.toUpperCase() === groupKey;
        });
        
        if (matchedKey && monthConsumptions[matchedKey] !== undefined && monthConsumptions[matchedKey] !== null && monthConsumptions[matchedKey] !== '') {
          slabConsumption = Number(monthConsumptions[matchedKey]);
        } else {
          const metadataKeys = ['power factor', 'electricity duty', 'peak demand (kva)', 'start date', 'end date', 'arrears', 'lpsc', 'miscellaneous charges'];
          const flatKey = Object.keys(monthConsumptions).find(k => k.toUpperCase() === 'FLAT' || k.toUpperCase() === 'TOTAL');
          let flatTotal = 0;
          if (flatKey && monthConsumptions[flatKey] !== undefined && monthConsumptions[flatKey] !== null && monthConsumptions[flatKey] !== '') {
            flatTotal = Number(monthConsumptions[flatKey]);
          } else {
            for (const [k, v] of Object.entries(monthConsumptions)) {
              if (v !== null && v !== '' && !metadataKeys.includes(k.toLowerCase())) {
                const numVal = Number(v);
                if (!isNaN(numVal)) {
                  flatTotal += numVal;
                }
              }
            }
          }
          if (flatTotal > 0) {
            const totalSlotsInMonth = slotsData.length;
            slabConsumption = flatTotal * (slotsInGroup.length / totalSlotsInMonth);
          }
        }

        if (slabConsumption <= 0) return;

        const numSlots = slotsInGroup.length;
        const requiredEnergyPerSlot = slabConsumption / numSlots;
        const maxPerSlot = getFlooredMaxEnergyPerSlot(sanctionedLoad);

        slotsInGroup.forEach((s, idx) => {
          (s as any)._idx = idx;
          (s as any).unfulfilledEnergy = requiredEnergyPerSlot;
          (s as any).marketEnergy = 0;
          (s as any).consumedMarketEnergy = 0;
          (s as any).exactMarketEnergyCost = 0;

          let basePrice = 0;
          if (s.marketSource === 'DAM') basePrice = s.damMcp || 0;
          else if (s.marketSource === 'RTM') basePrice = s.rtmMcp || 0;
          else if (s.marketSource === 'GDAM') basePrice = s.gdamMcp || 0;
          (s as any)._tempBasePrice = basePrice;
        });

        const marketSlots = slotsInGroup.filter(s => s.shouldBuyFromMarket && s.bestMarketLanding > 0);
        marketSlots.sort((a, b) => (a as any)._tempBasePrice - (b as any)._tempBasePrice);

        marketSlots.forEach(buyingSlot => {
          let availableToBuy = maxPerSlot - (buyingSlot as any).marketEnergy;
          if (availableToBuy <= 0) return;

          let boughtInThisSlot = 0;

          for (let i = (buyingSlot as any)._idx; i < numSlots; i++) {
            const targetSlot = slotsInGroup[i];
            if ((targetSlot as any).unfulfilledEnergy > 0) {
              const allocation = Math.min(availableToBuy, (targetSlot as any).unfulfilledEnergy);

              (targetSlot as any).unfulfilledEnergy -= allocation;
              (targetSlot as any).consumedMarketEnergy += allocation;
              (targetSlot as any).exactMarketEnergyCost += allocation * (buyingSlot as any)._tempBasePrice;

              boughtInThisSlot += allocation;
              availableToBuy -= allocation;

              if (availableToBuy <= 0) break;
            }
          }

          (buyingSlot as any).marketEnergy += boughtInThisSlot;
        });

        slotsInGroup.forEach(targetSlot => {
          (targetSlot as any).discomEnergy = (targetSlot as any).unfulfilledEnergy || 0;
        });
      }
    });

    // === PASS 2: Calculate Final Overheads & Aggregates ===
    const tradedDays = { DAM: new Set<string>(), GDAM: new Set<string>(), RTM: new Set<string>() };
    slotsData.forEach(s => {
      if (((s as any).marketEnergy || 0) > 0 && s.marketSource) {
        if (s.marketSource === 'DAM') tradedDays.DAM.add(s.date);
        else if (s.marketSource === 'GDAM') tradedDays.GDAM.add(s.date);
        else if (s.marketSource === 'RTM') tradedDays.RTM.add(s.date);
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
    const bidApplicationFees = (totalDamDays + totalGdamDays + totalRtmDays) * NLDC_APPLICATION_FEE_PER_BID;

    let totalBaselineCost = 0;
    let totalElectricityDuty = 0;
    let totalElectricityDutyAfterOA = 0;
    let totalLandedExchangeCost = 0;
    let totalDiscomAfterProlt = 0;
    let totalEnergyKwh = 0;
    let totalMarketEnergyKwh = 0;
    let totalBaselineEnergyCharges = 0;
    let totalDiscomEnergyChargesAfterOA = 0;
    let totalDemandAndFixedChargesApplied = 0;

    let globalCssCharge = 0;
    let globalRpoCharge = 0;
    let globalPocCharge = 0;
    let globalStuCharge = 0;
    let globalDcCharge = 0;
    let globalIexFee = 0;
    let globalTraderMargin = 0;
    let globalTraderMarginGst = 0;

    const todSummaries: { slabName: string; totalEnergyKwh: number; marketEnergyKwh: number; marketCostBase: number }[] = [];
    const oaDetailedBreakdown: any[] = [];

    const sortedTodKeys = Object.keys(slotsByTod).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    sortedTodKeys.forEach(groupKey => {
      const slotsInGroup = slotsByTod[groupKey];

      let slabConsumption = 0;
      if (shiftInsights) {
        const todSummary = shiftInsights.todShiftSummary.find((t: any) => t.tod === groupKey);
        slabConsumption = todSummary ? todSummary.newEnergy : 0;
      } else {
        const matchedKey = Object.keys(monthConsumptions).find(k => {
          if (k.toLowerCase().includes('peak demand') || k.toLowerCase().includes('sanctioned')) return false;
          return k.toUpperCase().includes(groupKey) || k.toUpperCase() === groupKey;
        });
        if (matchedKey && monthConsumptions[matchedKey] !== undefined && monthConsumptions[matchedKey] !== null && monthConsumptions[matchedKey] !== '') {
          slabConsumption = Number(monthConsumptions[matchedKey]);
        } else {
          const metadataKeys = ['power factor', 'electricity duty', 'peak demand (kva)', 'start date', 'end date', 'arrears', 'lpsc', 'miscellaneous charges'];
          const flatKey = Object.keys(monthConsumptions).find(k => k.toUpperCase() === 'FLAT' || k.toUpperCase() === 'TOTAL');
          let flatTotal = 0;
          if (flatKey && monthConsumptions[flatKey] !== undefined && monthConsumptions[flatKey] !== null && monthConsumptions[flatKey] !== '') {
            flatTotal = Number(monthConsumptions[flatKey]);
          } else {
            for (const [k, v] of Object.entries(monthConsumptions)) {
              if (v !== null && v !== '' && !metadataKeys.includes(k.toLowerCase())) {
                const numVal = Number(v);
                if (!isNaN(numVal)) {
                  flatTotal += numVal;
                }
              }
            }
          }
          if (flatTotal > 0) {
            const totalSlotsInMonth = slotsData.length;
            slabConsumption = flatTotal * (slotsByTod[groupKey].length / totalSlotsInMonth);
          }
        }
      }

      if (slabConsumption <= 0) return;

      let finalMarketEnergy = 0;
      let exactMarketEnergyCost = 0;
      let discomEnergy = 0;

      slotsInGroup.forEach(s => {
        finalMarketEnergy += (s as any).marketEnergy || 0;
        exactMarketEnergyCost += (s as any).exactMarketEnergyCost || 0;
        discomEnergy += (s as any).discomEnergy || 0;
      });

      const marketSlots = slotsInGroup.filter(s => ((s as any).marketEnergy || 0) > 0);

      const avgIstsLoss = marketSlots.length > 0
        ? marketSlots.reduce((sum, s: any) => sum + (s.istsLoss || 0), 0) / marketSlots.length
        : 0;

      const istsLossMultiplier = (1 - (avgIstsLoss / 100));
      const stuLossMultiplier = (1 - (stuLoss / 100));
      const wheelingLossMultiplier = (1 - (wheelingLoss / 100));

      const consumerBusUnits = finalMarketEnergy * istsLossMultiplier * stuLossMultiplier * wheelingLossMultiplier;

      const slabDiscomRate = slotsInGroup[0]?.discomLanding ?? 0;
      const safeGroupKey = String(groupKey || '').trim() || 'UNMAPPED';


      const slabFraction = preTotalEnergyKwh > 0 ? slabConsumption / preTotalEnergyKwh : 0;
      const slabDemandCharge = demandCharge * slabFraction;
      const slabEnergyBill = slabConsumption * slabDiscomRate;
      const fppaMultiplier = 1 + (fppaPercent / 100);

      const getDiscountedDemandCharge = (dc: number) => {
        return entry.discom === 'NPCL' ? dc * 0.90 * 0.99 : dc;
      };

      // FPPA should be applied on (energy charges + demand charges).
      const demandChargeWithFppa = getDiscountedDemandCharge(slabDemandCharge) * fppaMultiplier;
      totalDemandAndFixedChargesApplied += demandChargeWithFppa;

      const discountedSlabBill = slabEnergyBill + demandChargeWithFppa;
      totalBaselineEnergyCharges += slabEnergyBill;
      
      const edKey = Object.keys(monthConsumptions).find(k => k.toLowerCase() === 'electricity duty');
      let applyED = true;
      if (edKey && monthConsumptions[edKey] !== undefined && monthConsumptions[edKey] !== null) {
        applyED = String(monthConsumptions[edKey]).trim().toLowerCase() !== 'no';
      }

      const edRate = entry.consumerCategory === 'HV-1' ? 0.05 : 0.075;
      const slabED = applyED ? discountedSlabBill * edRate : 0;
      totalElectricityDuty += slabED;

      const slabTotalDiscomBill = discountedSlabBill + slabED;
      totalBaselineCost += slabTotalDiscomBill;

      const proltEnergyBill = discomEnergy * slabDiscomRate;
      totalDiscomEnergyChargesAfterOA += proltEnergyBill;
      const discountedProltBill = proltEnergyBill + demandChargeWithFppa;
      const slabEDAfterOA = applyED ? discountedProltBill * edRate : 0;
      totalElectricityDutyAfterOA += slabEDAfterOA;
      const proltDiscomBillTotal = discountedProltBill + slabEDAfterOA;
      totalDiscomAfterProlt += proltDiscomBillTotal;

      const nonGdamMarketEnergy = marketSlots.filter(s => s.marketSource !== 'GDAM').reduce((sum, s: any) => sum + (s.marketEnergy || 0), 0);
      const nonGdamFraction = finalMarketEnergy > 0 ? nonGdamMarketEnergy / finalMarketEnergy : 0;
      const nonGdamConsumerBusUnits = consumerBusUnits * nonGdamFraction;

      const rpoCharge = nonGdamConsumerBusUnits * RPO_FLAT_RATE;
      const cssCharge = consumerBusUnits * crossSubsidy;

      const pocCharge = finalMarketEnergy * ctuCharge;
      const stuChargeVal = finalMarketEnergy * stuCharge;
      const dcCharge = finalMarketEnergy * wheelingCharge;

      const iexFeesTotal = finalMarketEnergy * EXCHANGE_FEES;
      const traderMarginTotal = finalMarketEnergy * TRADER_MARGIN;
      const traderMarginGstTotal = finalMarketEnergy * GST_TRADER_MARGIN;

      globalCssCharge += cssCharge;
      globalRpoCharge += rpoCharge;
      globalPocCharge += pocCharge;
      globalStuCharge += stuChargeVal;
      globalDcCharge += dcCharge;
      globalIexFee += iexFeesTotal;
      globalTraderMargin += traderMarginTotal;
      globalTraderMarginGst += traderMarginGstTotal;

      const marketEnergyCost = exactMarketEnergyCost;
      const slabOaBill = cssCharge + rpoCharge + pocCharge + stuChargeVal + dcCharge + iexFeesTotal + marketEnergyCost;

      totalLandedExchangeCost += slabOaBill + proltDiscomBillTotal;

      totalEnergyKwh += slabConsumption;
      totalMarketEnergyKwh += finalMarketEnergy;

      todSummaries.push({
        slabName: safeGroupKey,
        totalEnergyKwh: slabConsumption,
        marketEnergyKwh: finalMarketEnergy,
        marketCostBase: marketEnergyCost
      });

      oaDetailedBreakdown.push({
        slabName: safeGroupKey,
        discomUnits: slabConsumption,
        oaUnits: finalMarketEnergy,
        discomBill: slabTotalDiscomBill,
        proltDiscomBill: proltDiscomBillTotal,
        consumerBusUnits,
        oaBill: slabOaBill
      });
    });

    const nocFee = 7000;
    const regFee = 8333;
    const consultancyFeeVal = entry.consultancyFee !== null && entry.consultancyFee !== undefined ? Number(entry.consultancyFee) : 20000;
    const platformFeeRate = entry.probusPlatformFee !== null && entry.probusPlatformFee !== undefined ? Number(entry.probusPlatformFee) : 0.02;
    const probusPlatformFee = Math.round(totalMarketEnergyKwh * platformFeeRate);

    totalBaselineCost += monthMisc;
    totalDiscomAfterProlt += monthMisc;
    totalLandedExchangeCost += monthMisc;

    const netSavings = totalBaselineCost - (totalLandedExchangeCost + dailyFixedOverhead + bidApplicationFees);

    // Treat proltMargin as a percentage of gross savings
    const proltMarginInput = Number(entry.proltMargin || 0);
    const grossSavings = Math.max(0, netSavings);
    const totalProltMarginCost = Math.round(grossSavings * (proltMarginInput / 100));

    const totalSavings = netSavings - nocFee - regFee - consultancyFeeVal - probusPlatformFee - totalProltMarginCost - globalTraderMargin - globalTraderMarginGst;

    // Ensure savings are never negative - if they would be, set to 0
    const finalSavings = Math.max(0, totalSavings);

    console.log('[Savings Debug] totalBaselineCost:', totalBaselineCost, 'totalLandedExchangeCost:', totalLandedExchangeCost, 'totalProltMarginCost:', totalProltMarginCost, 'totalSavings:', totalSavings, 'finalSavings:', finalSavings);

    const result = {
      clientId: id,
      clientName: entry.clientName,
      slotsData,
      totalEnergyKwh,
      totalMarketEnergyKwh,
      totalBaselineCost,
      fppaPercent,
      totalLandedExchangeCost,
      totalDiscomAfterProlt,
      baselineEnergyCharges: totalBaselineEnergyCharges,
      discomEnergyChargesAfterOA: totalDiscomEnergyChargesAfterOA,
      demandAndFixedChargesApplied: totalDemandAndFixedChargesApplied,
      electricityDutyAfterOA: totalElectricityDutyAfterOA,
      totalSavings: finalSavings,
      grossSavings,
      demandCharge,
      electricityDuty: totalElectricityDuty,
      arrearAmount: monthArrear,
      currentLpsc: monthLpsc,
      miscellaneousCharges: monthMisc,
      discom: entry.discom,
      peakDemand,
      demandChargeRate,
      todSummaries,
      oaDetailed: {
        breakdown: oaDetailedBreakdown,
        dailyFixedOverhead,
        nldcSchedulingCost,
        sldcSchedulingCost,
        bidApplicationFees,
        totalDaysTraded,
        totals: {
          cssCharge: globalCssCharge,
          cssRate: crossSubsidy,
          rpoCharge: globalRpoCharge,
          pocCharge: globalPocCharge,
          stuCharge: globalStuCharge,
          dcCharge: globalDcCharge,
          iexFee: globalIexFee,
          traderMargin: globalTraderMargin,
          traderMarginGst: globalTraderMarginGst,
          proltMarginCost: totalProltMarginCost,
          consultancyFee: consultancyFeeVal,
          probusPlatformFee,
          nocFee,
          regFee
        }
      }
    };

    await setCache(cacheKey, result, 86400);
    return result;
  }

  static async calculateDemandShiftInsightsAllMonths(id: string, version?: number) {
    const entry = await this.getEntryOrVersion(id, version);
    if (!entry) throw new Error('Entry not found');
    const todConsumptions = entry.todConsumptions as any;
    if (!todConsumptions) throw new Error('No consumption data found');

    const months = Object.keys(todConsumptions).sort();

    let originalTotalCost = 0;
    let newTotalCost = 0;
    let savingsAchieved = 0;
    let shiftedEnergy = 0;
    const aggregatedTodSummary: Record<string, any> = {};

    for (const month of months) {
      try {
        const res = await this.calculateDemandShiftInsights(id, month, version);
        originalTotalCost += res.originalTotalCost;
        newTotalCost += res.newTotalCost;
        savingsAchieved += res.savingsAchieved;
        shiftedEnergy += res.shiftedEnergy;

        for (const todSum of res.todShiftSummary) {
          if (!aggregatedTodSummary[todSum.tod]) {
            aggregatedTodSummary[todSum.tod] = { originalEnergy: 0, newEnergy: 0, diff: 0, originalMarketEnergy: 0, newMarketEnergy: 0 };
          }
          aggregatedTodSummary[todSum.tod].originalEnergy += todSum.originalEnergy;
          aggregatedTodSummary[todSum.tod].newEnergy += todSum.newEnergy;
          aggregatedTodSummary[todSum.tod].diff += todSum.diff;
          aggregatedTodSummary[todSum.tod].originalMarketEnergy += todSum.originalMarketEnergy;
          aggregatedTodSummary[todSum.tod].newMarketEnergy += todSum.newMarketEnergy;
        }
      } catch (e) {
        console.error("Error calculating demand shift for month", month, e);
      }
    }

    return {
      clientId: id,
      clientName: entry.clientName,
      sanctionedLoadKw: entry.sanctionedLoadKw ? Number(entry.sanctionedLoadKw) : 100,
      maxEnergyPerSlot: getFlooredMaxEnergyPerSlot(entry.sanctionedLoadKw ? Number(entry.sanctionedLoadKw) : 100),
      originalTotalCost,
      newTotalCost,
      savingsAchieved,
      shiftedEnergy,
      todShiftSummary: Object.entries(aggregatedTodSummary).map(([tod, data]) => ({
        tod,
        ...data
      })),
      slotsData: []
    };
  }

  static async calculateDemandShiftInsights(id: string, targetMonth?: string, version?: number) {
    if (targetMonth === 'all') {
      return this.calculateDemandShiftInsightsAllMonths(id, version);
    }
    const cacheVersion = version !== undefined ? version : 'live';
    const cacheKey = `demandshift:${id}:v:${cacheVersion}:m:${targetMonth || 'default'}`;
    const cached = await getCache(cacheKey);
    if (cached && false) {
      return cached;
    }
    const entry = await this.getEntryOrVersion(id, version);
    if (!entry) throw new Error('Entry not found');

    const marketResult = await this.calculateMarketDecision(id, targetMonth, version);
    const slotsData = marketResult.slotsData;

    const sanctionedLoadKw = entry.sanctionedLoadKw ? Number(entry.sanctionedLoadKw) : 100;
    const maxEnergyPerSlot = getFlooredMaxEnergyPerSlot(sanctionedLoadKw);

    let originalTotalCost = 0;

    // Enhance slots with shifting metadata
    const shiftableSlots = slotsData.map((s: any, index: number) => {
      const costPerKwh = s.shouldBuyFromMarket ? s.bestMarketLanding : s.discomLanding;
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
        shouldBuyFromMarket: s.shouldBuyFromMarket,
        headroom,
        date: s.date,
        timeblock: s.timeblock,
        tod: s.tod
      };
    });

    // Sort for finding sources (most expensive) and destinations (cheapest)
    const expensiveSlots = [...shiftableSlots].sort((a, b) => b.costPerKwh - a.costPerKwh);
    const cheapSlots = [...shiftableSlots].sort((a, b) => a.costPerKwh - b.costPerKwh);

    let shiftedEnergy = 0;
    let savingsAchieved = 0;
    let expensiveIdx = 0;
    let cheapIdx = 0;

    while (expensiveIdx < expensiveSlots.length && cheapIdx < cheapSlots.length) {
      const expSlot = expensiveSlots[expensiveIdx];
      const cheapSlot = cheapSlots[cheapIdx];

      // If the expensive slot is actually cheaper or same as the cheap slot, we're done shifting
      if (expSlot.costPerKwh <= cheapSlot.costPerKwh + 0.01) { // Adding a small 1 paisa margin
        break;
      }

      if (expSlot.currentEnergy <= 0) {
        expensiveIdx++;
        continue;
      }

      if (cheapSlot.headroom <= 0) {
        cheapIdx++;
        continue;
      }

      // We can shift
      const amountToShift = Math.min(expSlot.currentEnergy, cheapSlot.headroom);

      expSlot.currentEnergy -= amountToShift;
      // Remove energy from the most expensive source in the expensive slot first
      // If it's a mix, discom is usually the more expensive part if we bought market up to max
      // Let's just remove from discom first, then market
      if (expSlot.currentDiscomEnergy >= amountToShift) {
        expSlot.currentDiscomEnergy -= amountToShift;
      } else {
        const remainingToRemove = amountToShift - expSlot.currentDiscomEnergy;
        expSlot.currentDiscomEnergy = 0;
        expSlot.currentMarketEnergy -= remainingToRemove;
      }

      cheapSlot.headroom -= amountToShift;
      cheapSlot.currentEnergy += amountToShift;
      // Add energy to the cheap slot using its cheapest available source (determined by shouldBuyFromMarket)
      if (cheapSlot.shouldBuyFromMarket) {
        cheapSlot.currentMarketEnergy += amountToShift;
      } else {
        cheapSlot.currentDiscomEnergy += amountToShift;
      }

      shiftedEnergy += amountToShift;
      savingsAchieved += amountToShift * (expSlot.costPerKwh - cheapSlot.costPerKwh);
    }

    let newTotalCost = 0;
    shiftableSlots.forEach((s: any) => {
      newTotalCost += (s.currentEnergy * s.costPerKwh);
    });

    // Calculate TOD breakdown changes
    const todShiftSummary: Record<string, { originalEnergy: number, newEnergy: number, diff: number, originalMarketEnergy: number, newMarketEnergy: number }> = {};
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

    const result = {
      clientId: id,
      clientName: entry.clientName,
      sanctionedLoadKw,
      maxEnergyPerSlot,
      originalTotalCost,
      newTotalCost,
      savingsAchieved,
      shiftedEnergy,
      todShiftSummary: Object.entries(todShiftSummary).map(([tod, data]) => ({
        tod,
        ...data
      })),
      slotsData: shiftableSlots.map((s: any) => {
        const originalSlot = slotsData[s.originalIndex];
        return {
          date: s.date,
          timeblock: s.timeblock,
          tod: s.tod,
          originalEnergy: s.originalEnergy,
          newEnergy: s.currentEnergy,
          costPerKwh: s.costPerKwh,
          marketSource: originalSlot.marketSource,
          shouldBuyFromMarket: s.shouldBuyFromMarket,
          marketEnergy: s.currentMarketEnergy,
          discomEnergy: s.currentDiscomEnergy,
          damMcp: originalSlot.damMcp,
          rtmMcp: originalSlot.rtmMcp,
          gdamMcp: originalSlot.gdamMcp
        };
      })
    };

    await setCache(cacheKey, result, 86400);
    return result;
  }
}
