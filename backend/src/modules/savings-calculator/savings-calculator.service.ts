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
  static async calculateSavings(id: string, month: number, year: number) {
    const entry = await this.getById(id);
    if (!entry) {
      throw new Error('Entry not found');
    }

    const stateCode = entry.stateCode || 'MH';
    const sanctionedLoad = entry.sanctionedLoadKw ? Number(entry.sanctionedLoadKw) : 100;
    const category = entry.consumerCategory || 'Industrial';
    const rawVoltage = entry.voltageLevel || '11 kV';
    const digitsMatch = rawVoltage.match(/^(\d+)/);
    const voltage = digitsMatch ? `${digitsMatch[1]} kV` : rawVoltage;

    // 15-minute slot energy limit in kWh = load (kW) * 0.25 hours
    const maxEnergyPerSlot = sanctionedLoad * 0.25;

    const whereClause: any = {
      stateCode,
      month,
      category,
      voltageLevel: voltage
    };

    if (entry.discom) {
      whereClause.discom = entry.discom;
    }

    // Fetch matching StateTariff slabs from DB
    const tariffs = await prisma.stateTariff.findMany({
      where: whereClause
    });

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
      // Handle postgres casing quirks: raw query keys can be lowercased
      const deliveryDate = rec.date ? new Date(rec.date) : new Date(startStr);
      const dateStr = deliveryDate.toISOString().split('T')[0];
      const slot = rec.timeblock || rec.timeblock === 0 ? Number(rec.timeblock) : 1; // 1-96

      // Format interval time string
      const startMinutes = (slot - 1) * 15;
      const hour = Math.floor(startMinutes / 60);
      const minute = startMinutes % 60;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      // Convert MCPs (Rs/MWh) to Rs/kWh (divide by 1000)
      const rawDam = rec.damMcp !== undefined ? rec.damMcp : rec.dammcp;
      const rawRtm = rec.rtmMcp !== undefined ? rec.rtmMcp : rec.rtmmcp;
      const rawGdam = rec.gdamMcp !== undefined ? rec.gdamMcp : rec.gdammcp;

      const damLandingPrice = rawDam ? (Number(rawDam) / 1000) : 0;
      const rtmLandingPrice = rawRtm ? (Number(rawRtm) / 1000) : 0;
      const gdamLandingPrice = rawGdam ? (Number(rawGdam) / 1000) : 0;

      // Find DISCOM Landing Price matching TOD ranges in StateTariff
      let discomLandingPrice = 7.5; // default fallback
      let matchedTariffName = 'normal';

      if (tariffs.length > 0) {
        const matched = tariffs.find(t => {
          const start = parseHour(t.todStartHour);
          const end = parseHour(t.todEndHour);
          if (start <= end) {
            return hour >= start && hour < end;
          } else {
            return hour >= start || hour < end; // mid-night span
          }
        });

        if (matched) {
          discomLandingPrice = Number(matched.energyCharges || matched.baseEnergyCharges || 7.5);
          matchedTariffName = matched.todName || matched.tod || 'normal';
        }
      } else {
        // Broad default off-peak / peak classification if no tariffs mapped in database
        if (hour >= 22 || hour < 6) {
          discomLandingPrice = 6.0;
          matchedTariffName = 'offpeak';
        } else if (hour >= 18 && hour < 22) {
          discomLandingPrice = 8.5;
          matchedTariffName = 'peak';
        }
      }

      // Comparison: Compare DAM, GDAM, RTM, and DISCOM price of that slot
      let comparedLowestPrice = discomLandingPrice;
      let selectedSource = 'DISCOM';

      if (damLandingPrice > 0 && damLandingPrice < comparedLowestPrice) {
        comparedLowestPrice = damLandingPrice;
        selectedSource = 'DAM';
      }
      if (rtmLandingPrice > 0 && rtmLandingPrice < comparedLowestPrice) {
        comparedLowestPrice = rtmLandingPrice;
        selectedSource = 'RTM';
      }
      if (gdamLandingPrice > 0 && gdamLandingPrice < comparedLowestPrice) {
        comparedLowestPrice = gdamLandingPrice;
        selectedSource = 'GDAM';
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

    // Group slots by TOD Slab for TOD-sorted blocks and count them
    const groups: { [key: string]: typeof slotsData } = {};
    const todCounts: Record<string, number> = {};

    slotsData.forEach(item => {
      // Use the exact todSlab string so it differentiates Summer vs Winter slabs
      let groupKey = item.todSlab.toUpperCase();
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      todCounts[groupKey] = (todCounts[groupKey] || 0) + 1;
    });

    // Second pass to calculate energy and costs with chronological banking
    const todConsumptions = entry.todConsumptions as Record<string, number> | null;
    
    // 1. Sort slots chronologically to model the flow of time
    slotsData.sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.slot - b.slot;
    });

    // 2. Initialize requirements and available capacities
    const requirements: number[] = new Array(slotsData.length).fill(0);
    const availableCapacities: number[] = new Array(slotsData.length).fill(maxEnergyPerSlot);
    const optimizedCosts: number[] = new Array(slotsData.length).fill(0);

    slotsData.forEach((item, index) => {
      let groupKey = item.todSlab.toUpperCase();
      let requiredEnergy = maxEnergyPerSlot; // default fallback
      if (todConsumptions && todConsumptions[groupKey] !== undefined && todConsumptions[groupKey] !== null) {
        const totalEnergy = Number(todConsumptions[groupKey]);
        const count = todCounts[groupKey];
        requiredEnergy = count > 0 ? totalEnergy / count : 0;
      }
      requirements[index] = requiredEnergy;
      item.maxEnergyPerSlot = requiredEnergy; // Track required energy for reporting
      item.baselineCost = item.discomLandingPrice * requiredEnergy;
    });

    // 3. Sort indices by lowest price to prioritize cheapest buying slots (Greedy allocation)
    const priceSortedIndices = slotsData
      .map((_, index) => index)
      .sort((a, b) => slotsData[a].comparedLowestPrice - slotsData[b].comparedLowestPrice);

    // 4. Allocate energy: Cheapest slots satisfy their current and future requirements within the month
    for (const pIndex of priceSortedIndices) {
      let amountToGive = availableCapacities[pIndex];
      const pSlot = slotsData[pIndex];
      const pGroup = pSlot.todSlab.toUpperCase();

      for (let sIndex = pIndex; sIndex < slotsData.length; sIndex++) {
        if (amountToGive <= 0) break;
        
        const sSlot = slotsData[sIndex];
        const sGroup = sSlot.todSlab.toUpperCase();
        
        // Ensure banking matches the same TOD slab group (as users bid per TOD structure)
        if (sGroup !== pGroup) continue;

        if (requirements[sIndex] > 0) {
          const take = Math.min(requirements[sIndex], amountToGive);
          requirements[sIndex] -= take;
          amountToGive -= take;
          
          // Cost is assigned to the slot that uses the energy (for reporting correctly)
          optimizedCosts[sIndex] += take * pSlot.comparedLowestPrice;
        }
      }
      availableCapacities[pIndex] = amountToGive;
    }

    // 5. Any unfulfilled requirements (due to physical limits) must be bought at DISCOM rate
    slotsData.forEach((item, index) => {
      if (requirements[index] > 0) {
        optimizedCosts[index] += requirements[index] * item.discomLandingPrice;
      }
      item.optimizedCost = optimizedCosts[index];
    });

    // Sort each TOD group in itself by comparedLowestPrice ascending
    const sortedGroups: { [key: string]: typeof slotsData } = {};
    Object.keys(groups).forEach(key => {
      sortedGroups[key] = [...groups[key]].sort((a, b) => a.comparedLowestPrice - b.comparedLowestPrice);
    });

    // Create the overall monthly list sorted by price
    const sortedMonthlyList = [...slotsData].sort((a, b) => a.comparedLowestPrice - b.comparedLowestPrice);

    // Sum overall metrics
    let totalOptimizedCost = 0;
    let totalBaselineCost = 0;
    let totalEnergyKwh = 0;

    slotsData.forEach(item => {
      totalOptimizedCost += item.optimizedCost;
      totalBaselineCost += item.baselineCost;
      totalEnergyKwh += item.maxEnergyPerSlot;
    });

    const totalSavings = totalBaselineCost - totalOptimizedCost;

    return {
      clientId: id,
      clientName: entry.clientName,
      month,
      year,
      sanctionedLoad,
      maxEnergyPerSlot,
      totalEnergyKwh,
      totalBaselineCost,
      totalOptimizedCost,
      totalSavings,
      todGroups: sortedGroups,
      sortedMonthlyList
    };
  }
}
