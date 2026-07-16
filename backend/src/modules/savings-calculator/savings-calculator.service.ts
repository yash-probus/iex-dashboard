import prisma from '../../config/prisma';

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
    todConsumptions?: any;
  }) {
    return prisma.savingsCalculatorEntry.create({
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
        todConsumptions: data.todConsumptions
      }
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
    todConsumptions?: any;
  }) {
    return prisma.savingsCalculatorEntry.update({
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
        todConsumptions: data.todConsumptions
      }
    });
  }

  static async delete(id: string) {
    return prisma.savingsCalculatorEntry.delete({
      where: { id }
    });
  }

  // Savings calculation logic
  static async calculateSavings(id: string, targetMonth?: string) {
    const entry = await this.getById(id);
    if (!entry) {
      throw new Error('Entry not found');
    }

    const category = entry.consumerCategory || 'Industrial';
    if (category.startsWith('LMV-11')) {
      return this.calculateSavingsLMV11(entry, targetMonth);
    } else if (category.startsWith('HV-1')) {
      return this.calculateSavingsHV1(entry, targetMonth);
    } else {
      // Default to HV-2 logic for now
      return this.calculateSavingsHV2(entry, targetMonth);
    }
  }

  static async calculateSavingsLMV11(entry: any, targetMonth?: string) {
    throw new Error('Calculation logic for LMV-11 is not yet implemented.');
  }

  static async calculateSavingsHV1(entry: any, targetMonth?: string) {
    throw new Error('Calculation logic for HV-1 is not yet implemented.');
  }

  static async calculateSavingsHV2(entry: any, targetMonth?: string) {
    const id = entry.id;
    const stateCode = entry.stateCode || 'MH';
    const sanctionedLoad = entry.sanctionedLoadKw ? Number(entry.sanctionedLoadKw) : 100;
    const category = entry.consumerCategory || 'Industrial';
    const rawVoltage = entry.voltageLevel || '11 kV';
    const digitsMatch = rawVoltage.match(/^(\d+)/);
    const voltage = digitsMatch ? `${digitsMatch[1]} kV` : rawVoltage;

    // 15-minute slot energy limit in kWh = load (kW) * 0.25 hours
    const maxEnergyPerSlot = sanctionedLoad * 0.25;

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
      const yyyymmMonth = parseInt(`${yearStr}${monthStr.padStart(2, '0')}`, 10);

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

      const whereClause: any = {
        state: stateName,
        consumerCategory: category,
        supplyVoltageCategory: parsedSupplyVoltageCategory,
        month: yyyymmMonth
      };

      // Fetch FPPA percent
      const fppaData = await prisma.fppaCharges.findFirst({
        where: {
          state: { in: [stateName.toUpperCase(), stateName.toUpperCase().replace(/\s+/g, '_')] },
          month: yyyymmMonth
        }
      });
      const fppaPercent = fppaData?.fppaChargePercent ? Number(fppaData.fppaChargePercent) : 0;

      // Fetch matching StateTariff slabs from DB
      let tariffs = await prisma.stateTariff.findMany({
        where: whereClause
      });

      if (tariffs.length === 0) {
        const allTariffs = await prisma.stateTariff.findMany({
          where: { state: stateName, consumerCategory: category, supplyVoltageCategory: parsedSupplyVoltageCategory },
          orderBy: { month: 'desc' }
        });
        const sameMonthTariff = allTariffs.find(t => (t.month % 100) === month);
        const latestTariff = sameMonthTariff || allTariffs[0];

        if (latestTariff) {
          whereClause.month = latestTariff.month;
          tariffs = allTariffs.filter(t => t.month === latestTariff.month);
        }
      }

      // Query combined DAM, GDAM, and RTM records for the selected month using FULL OUTER JOIN
      const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endStr = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

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

        if (tariffs.length > 0) {
          const matched = tariffs.find(t => {
            const start = parseHour(t.todStartTime);
            const end = parseHour(t.todEndTime);
            if (start <= end) {
              return hour >= start && hour < end;
            } else {
              return hour >= start || hour < end;
            }
          });

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

        let comparedLowestPrice = discomLandingPrice;
        let selectedSource = 'DISCOM';

        // Source 100% from Open Access if available, regardless of whether it's cheaper than DISCOM
        const availableMarkets = [];
        if (damLandingPrice > 0) availableMarkets.push({ source: 'DAM', price: damLandingPrice });
        if (rtmLandingPrice > 0) availableMarkets.push({ source: 'RTM', price: rtmLandingPrice });
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
          baselineCost: 0
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
        const matchedKey = Object.keys(monthConsumptions).find(k => {
          if (k.toLowerCase().includes('peak demand') || k.toLowerCase().includes('sanctioned')) return false;
          return k.toUpperCase().includes(groupKey) || k.toUpperCase() === groupKey;
        });

        if (matchedKey && monthConsumptions[matchedKey] !== undefined && monthConsumptions[matchedKey] !== null && monthConsumptions[matchedKey] !== '') {
          remainingEnergy = Number(monthConsumptions[matchedKey]);
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

  static async calculateMarketDecision(id: string, targetMonthStr?: string) {
    const entry = await prisma.savingsCalculatorEntry.findUnique({
      where: { id }
    });

    if (!entry) {
      throw new Error('Savings calculator entry not found');
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
    const yyyymmMonth = parseInt(`${year}${String(month).padStart(2, '0')}`, 10);
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

    const traderMargin = Number(entry.traderMargin || 0);

    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endStr = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    const targetDate = new Date(startStr);

    let parsedSupplyVoltageCategory = voltageLevel;
    if (parsedSupplyVoltageCategory.includes(' - ')) {
      parsedSupplyVoltageCategory = parsedSupplyVoltageCategory.split(' - ')[0];
    }

    const stateCharges = await prisma.stateCharges.findFirst({
      where: {
        state: stateName.toUpperCase().replace(/\s+/g, '_'),
        category: category,
        // StateCharges uses the full string (e.g. '33' or '0.433') so we might need the second part if available
        // But for now, we will just use voltageLevel since it was '0.433' in DB. Or we can just omit it if it fails.
        // Let's omit voltageLevel for now to avoid false negatives since StateCharges has different voltage formatting.
      }
    });

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

    let whereClauseTariff: any = { state: stateName, consumerCategory: category, supplyVoltageCategory: parsedSupplyVoltageCategory, month: yyyymmMonth };
    let tariffs = await prisma.stateTariff.findMany({ where: whereClauseTariff });

    if (tariffs.length === 0) {
      const allTariffs = await prisma.stateTariff.findMany({
        where: { state: stateName, consumerCategory: category, supplyVoltageCategory: parsedSupplyVoltageCategory },
        orderBy: { month: 'desc' }
      });
      const sameMonthTariff = allTariffs.find(t => (t.month % 100) === month);
      const latestTariff = sameMonthTariff || allTariffs[0];

      if (latestTariff) {
        whereClauseTariff.month = latestTariff.month;
        tariffs = allTariffs.filter(t => t.month === latestTariff.month);
      }
    }

    const EXCHANGE_FEES = 0.02;
    const GST_EXCHANGE = 0.0036;
    const OTHER_CHARGES = 0.1;
    const TRADER_MARGIN = traderMargin;
    const GST_TRADER_MARGIN = TRADER_MARGIN * 0.18;
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

    // Fetch FPPA percent
    const fppaData = await prisma.fppaCharges.findFirst({
      where: {
        state: { in: [stateName.toUpperCase(), stateName.toUpperCase().replace(/\s+/g, '_')] },
        month: yyyymmMonth
      }
    });
    const fppaPercent = fppaData?.fppaChargePercent ? Number(fppaData.fppaChargePercent) : 0;

    const ctuCharge = Number(ctuCharges.ctu_charges_rs_per_kwh);
    const stuCharge = Number(stateCharges.stuCharges);
    const wheelingCharge = Number(stateCharges.distributionWheelingCharges);
    const crossSubsidy = Number(stateCharges.crossSubsidy);
    const additionalSurcharge = Number(stateCharges.additionalCharge);
    const stuLoss = Number(stateCharges.stuLossPercent);
    const wheelingLoss = Number(stateCharges.wheelingLossPercent);

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
        const lossCoefficient = (1 - (istsLoss / 100)) * (1 - (stuLoss / 100)) * (1 - (wheelingLoss / 100));
        const lossAdjustedMcp = mcp / lossCoefficient;
        return lossAdjustedMcp + ctuCharge + stuCharge + wheelingCharge + OTHER_CHARGES + EXCHANGE_FEES + GST_EXCHANGE + TRADER_MARGIN + GST_TRADER_MARGIN + crossSubsidy + additionalSurcharge;
      };

      const damLanding = calcExchangeLanding(damMcp);
      const rtmLanding = calcExchangeLanding(rtmMcp);
      const gdamLanding = calcExchangeLanding(gdamMcp);

      const marketPrices = [damLanding, rtmLanding, gdamLanding].filter(p => p !== null) as number[];
      const bestMarketLanding = marketPrices.length > 0 ? Math.min(...marketPrices) : 0;

      let marketSource = 'DAM';
      if (bestMarketLanding === rtmLanding) marketSource = 'RTM';
      if (bestMarketLanding === gdamLanding) marketSource = 'GDAM';

      let discomBase = 7.5;
      let matchedTariffName = 'normal';
      if (tariffs.length > 0) {
        const matched = tariffs.find(t => {
          const start = parseHour(t.todStartTime);
          const end = parseHour(t.todEndTime);
          if (start <= end) return hour >= start && hour < end;
          return hour >= start || hour < end;
        });
        if (matched) {
          discomBase = Number(matched.energyRate || matched.baseEnergyRate || 7.5);
          matchedTariffName = (matched.todStartTime !== '—' && matched.todEndTime !== '—')
            ? `${matched.todStartTime}-${matched.todEndTime}`.toUpperCase()
            : 'FLAT';
        }
      }

      const discomLanding = discomBase * (1 + (fppaPercent / 100));

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
        istsLoss
      };
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

    const monthKey = targetMonthStr || `${year}-${String(month).padStart(2, '0')}`;
    const monthConsumptions = (entry.todConsumptions as Record<string, Record<string, number | string>> | null)?.[monthKey] || {};

    let peakDemand = 0;
    Object.keys(monthConsumptions).forEach(k => {
      if (k.toLowerCase().includes('peak demand') || k.toLowerCase().includes('sanctioned')) {
        peakDemand = Math.max(peakDemand, Number(monthConsumptions[k]) || 0);
      }
    });

    const demandChargeRate = stateCharges ? Number(stateCharges.demandFixedChargeKvaPerMonthRs || 0) : 0;
    const demandCharge = peakDemand * demandChargeRate;

    // Group slots by TOD slab
    const slotsByTod: Record<string, typeof slotsData> = {};
    const tradedDays = { DAM: new Set<string>(), GDAM: new Set<string>(), RTM: new Set<string>() };

    slotsData.forEach(s => {
      const key = s.tod.toUpperCase();
      if (!slotsByTod[key]) slotsByTod[key] = [];
      slotsByTod[key].push(s);

      if (s.shouldBuyFromMarket && s.marketSource) {
        // Safe check since RTM/DAM/GDAM are the sources
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
    const dailyFixedOverhead = (nldcSchedulingFees + sldcSchedulingFees) * totalDaysTraded;
    const bidApplicationFees = (totalDamDays + totalGdamDays + totalRtmDays) * NLDC_APPLICATION_FEE_PER_BID;

    let totalBaselineCost = 0;
    let totalElectricityDuty = 0;
    let totalLandedExchangeCost = 0;
    let totalEnergyKwh = 0;
    let totalMarketEnergyKwh = 0;

    let globalCssCharge = 0;
    let globalRpoCharge = 0;
    let globalPocCharge = 0;
    let globalStuCharge = 0;
    let globalDcCharge = 0;
    let globalIexFee = 0;

    const todSummaries: { slabName: string; totalEnergyKwh: number; marketEnergyKwh: number; marketCostBase: number }[] = [];
    const oaDetailedBreakdown: any[] = [];

    console.log(`[MarketDecision] monthKey=${monthKey}, consumptionKeys=${JSON.stringify(Object.keys(monthConsumptions))}, todGroups=${JSON.stringify(Object.keys(slotsByTod))}`);

    let preTotalEnergyKwh = 0;
    Object.keys(slotsByTod).forEach(groupKey => {
      const matchedKey = Object.keys(monthConsumptions).find(k => {
        if (k.toLowerCase().includes('peak demand') || k.toLowerCase().includes('sanctioned')) return false;
        return k.toUpperCase().includes(groupKey) || k.toUpperCase() === groupKey;
      });
      if (matchedKey && monthConsumptions[matchedKey] !== undefined && monthConsumptions[matchedKey] !== '') {
        preTotalEnergyKwh += Number(monthConsumptions[matchedKey]);
      }
    });

    Object.keys(slotsByTod).forEach(groupKey => {
      const slotsInGroup = slotsByTod[groupKey];

      // Match user-entered consumption for this TOD slab
      let slabConsumption = 0;
      const matchedKey = Object.keys(monthConsumptions).find(k => {
        if (k.toLowerCase().includes('peak demand') || k.toLowerCase().includes('sanctioned')) return false;
        return k.toUpperCase().includes(groupKey) || k.toUpperCase() === groupKey;
      });
      if (matchedKey && monthConsumptions[matchedKey] !== undefined && monthConsumptions[matchedKey] !== '') {
        slabConsumption = Number(monthConsumptions[matchedKey]);
      }

      if (slabConsumption <= 0) {
        console.log(`[MarketDecision] Slab ${groupKey}: no consumption matched (matchedKey=${matchedKey})`);
        return;
      }

      const totalSlots = slotsInGroup.length;

      // Slots where market landing is cheaper than DISCOM (and valid)
      const marketSlots = slotsInGroup.filter(s => s.shouldBuyFromMarket && s.bestMarketLanding > 0);
      const discomSlots = slotsInGroup.filter(s => !s.shouldBuyFromMarket || s.bestMarketLanding <= 0);

      const marketFraction = totalSlots > 0 ? marketSlots.length / totalSlots : 0;
      const discomFraction = 1 - marketFraction;

      const marketEnergy = slabConsumption * marketFraction;
      const discomEnergy = slabConsumption * discomFraction;

      // Average DISCOM rate for this slab (should be same for all slots, take first valid)
      const slabDiscomRate = slotsInGroup[0]?.discomLanding ?? 0;

      // Average base market price for market-cheaper slots (before all charges)
      const avgMarketPrice = marketSlots.length > 0
        ? marketSlots.reduce((sum, s) => {
          let basePrice = 0;
          if (s.marketSource === 'DAM') basePrice = s.damMcp || 0;
          else if (s.marketSource === 'RTM') basePrice = s.rtmMcp || 0;
          else if (s.marketSource === 'GDAM') basePrice = s.gdamMcp || 0;
          return sum + basePrice;
        }, 0) / marketSlots.length
        : 0;

      // Calculate ED and Prorated Demand Charge for this slab
      const slabFraction = preTotalEnergyKwh > 0 ? slabConsumption / preTotalEnergyKwh : 0;
      const slabDemandCharge = demandCharge * slabFraction;
      const slabEnergyBill = slabConsumption * slabDiscomRate;
      const slabED = slabEnergyBill * 0.075;
      totalElectricityDuty += slabED;

      // Baseline: all consumption at DISCOM rate (inclusive of fixed/taxes)
      const slabTotalDiscomBill = slabEnergyBill + slabDemandCharge + slabED;
      totalBaselineCost += slabTotalDiscomBill;

      // Prolt Discom Bill is the DISCOM bill for the un-switched units + 100% of the fixed/taxes
      const proltEnergyBill = discomEnergy * slabDiscomRate;
      // ED applies to total consumption physical units (same as baseline), demand charge is also fixed.
      const proltDiscomBillTotal = proltEnergyBill + slabDemandCharge + slabED;

      const avgIstsLoss = marketSlots.length > 0
        ? marketSlots.reduce((sum, s: any) => sum + (s.istsLoss || 0), 0) / marketSlots.length
        : 0;

      const istsLossMultiplier = (1 - (avgIstsLoss / 100));
      const stuLossMultiplier = (1 - (stuLoss / 100));
      const wheelingLossMultiplier = (1 - (wheelingLoss / 100));
      const consumerBusUnits = marketEnergy * istsLossMultiplier * stuLossMultiplier * wheelingLossMultiplier;

      const nonGdamMarketSlots = marketSlots.filter(s => s.marketSource !== 'GDAM').length;
      const nonGdamFraction = marketSlots.length > 0 ? nonGdamMarketSlots / marketSlots.length : 0;
      const nonGdamConsumerBusUnits = consumerBusUnits * nonGdamFraction;
      
      const rpoCharge = nonGdamConsumerBusUnits * RPO_FLAT_RATE;
      const cssCharge = consumerBusUnits * crossSubsidy;
      
      const pocCharge = marketEnergy * ctuCharge;
      const stuChargeVal = marketEnergy * stuCharge;
      const dcCharge = marketEnergy * wheelingCharge;

      const iexFeesTotal = marketEnergy * EXCHANGE_FEES;
      const traderMarginTotal = marketEnergy * TRADER_MARGIN;
      
      globalCssCharge += cssCharge;
      globalRpoCharge += rpoCharge;
      globalPocCharge += pocCharge;
      globalStuCharge += stuChargeVal;
      globalDcCharge += dcCharge;
      globalIexFee += iexFeesTotal + traderMarginTotal; // Combining IEX Fee + Trader Margin into one as requested

      const marketEnergyCost = marketEnergy * avgMarketPrice;
      const slabOaBill = cssCharge + rpoCharge + pocCharge + stuChargeVal + dcCharge + iexFeesTotal + traderMarginTotal + marketEnergyCost;

      // Exchange cost: market portion with all surcharges + Prolt DISCOM Bill
      totalLandedExchangeCost += slabOaBill + proltDiscomBillTotal;

      totalEnergyKwh += slabConsumption;
      totalMarketEnergyKwh += marketEnergy;

      todSummaries.push({
        slabName: groupKey,
        totalEnergyKwh: slabConsumption,
        marketEnergyKwh: marketEnergy,
        marketCostBase: marketEnergyCost
      });

      // --- OA Detailed Simulation Breakdowns ---
      const discomBill = slabTotalDiscomBill;
      const proltDiscomBill = proltDiscomBillTotal;

      oaDetailedBreakdown.push({
        slabName: groupKey,
        discomUnits: slabConsumption,
        oaUnits: marketEnergy,
        discomBill,
        proltDiscomBill,
        consumerBusUnits,
        oaBill: slabOaBill
      });

      console.log(`[MarketDecision] Slab ${groupKey}: consumption=${slabConsumption}kWh, discomRate=${slabDiscomRate.toFixed(4)}, marketSlots=${marketSlots.length}/${totalSlots} (${(marketFraction * 100).toFixed(1)}%), avgMarketPrice=${avgMarketPrice.toFixed(4)}, baselineCost=${(slabConsumption * slabDiscomRate).toFixed(0)}`);
    });

    const totalSavings = totalBaselineCost - totalLandedExchangeCost;

    return {
      clientId: id,
      clientName: entry.clientName,
      slotsData,
      totalEnergyKwh,
      totalMarketEnergyKwh,
      totalBaselineCost,
      totalLandedExchangeCost,
      totalSavings,
      demandCharge,
      electricityDuty: totalElectricityDuty,
      todSummaries,
      oaDetailed: {
        breakdown: oaDetailedBreakdown,
        dailyFixedOverhead,
        bidApplicationFees,
        totalDaysTraded,
        totals: {
          cssCharge: globalCssCharge,
          rpoCharge: globalRpoCharge,
          pocCharge: globalPocCharge,
          stuCharge: globalStuCharge,
          dcCharge: globalDcCharge,
          iexFee: globalIexFee
        }
      }
    };
  }
}
