import prisma from '../../config/prisma';

export interface ForecastIntervalData {
  date: string;
  hour: string;
  timeBlock: string;
  intervalNumber: number;
  purchaseBid: number;
  sellBid: number;
  mcv: number;
  fsv: number;
  mcp: number;
}

export interface DemandForecastIntervalData {
  date: string;
  hour: string;
  timeBlock: string;
  intervalNumber: number;
  demand: number; // in MW or kW
  frequency?: number; // in Hz
}

export class ForecastService {
  /**
   * Helper to format timeblock from interval number
   */
  private static getIntervalTime(intervalNum: number): string {
    const totalMinutes = (intervalNum - 1) * 15;
    const startHour = Math.floor(totalMinutes / 60);
    const startMin = totalMinutes % 60;
    const endMinutes = totalMinutes + 15;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(startHour)}:${pad(startMin)}-${pad(endHour)}:${pad(endMin)}`;
  }

  /**
   * Generates a date array between two dates
   */
  private static getDatesInRange(startDateStr: string, endDateStr: string): string[] {
    const dates: string[] = [];
    const curr = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    // limit safety to prevent endless loops
    let limit = 0;
    while (curr <= end && limit < 100) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
      limit++;
    }
    return dates;
  }

  private static aggregatePriceIntervals(records: ForecastIntervalData[], interval: string): ForecastIntervalData[] {
    if (interval === '15min') return records;

    if (interval === 'hourly') {
      const hourlyData: ForecastIntervalData[] = [];
      for (let h = 0; h < 24; h++) {
        const hourStr = h.toString().padStart(2, '0');
        const hourRecords = records.filter(r => parseInt(r.hour) === h + 1);
        if (hourRecords.length === 0) continue;

        const sumMcp = hourRecords.reduce((sum, r) => sum + r.mcp, 0);
        const sumPurchase = hourRecords.reduce((sum, r) => sum + r.purchaseBid, 0);
        const sumSell = hourRecords.reduce((sum, r) => sum + r.sellBid, 0);
        const sumMcv = hourRecords.reduce((sum, r) => sum + r.mcv, 0);
        const sumFsv = hourRecords.reduce((sum, r) => sum + r.fsv, 0);

        hourlyData.push({
          date: hourRecords[0].date,
          hour: hourStr,
          timeBlock: `${hourStr}:00`,
          intervalNumber: h + 1,
          purchaseBid: Math.round(sumPurchase / hourRecords.length),
          sellBid: Math.round(sumSell / hourRecords.length),
          mcv: Math.round(sumMcv / hourRecords.length),
          fsv: Math.round(sumFsv / hourRecords.length),
          mcp: parseFloat((sumMcp / hourRecords.length).toFixed(2))
        });
      }
      return hourlyData;
    }

    // Daily aggregation
    const sumMcp = records.reduce((sum, r) => sum + r.mcp, 0);
    const sumPurchase = records.reduce((sum, r) => sum + r.purchaseBid, 0);
    const sumSell = records.reduce((sum, r) => sum + r.sellBid, 0);
    const sumMcv = records.reduce((sum, r) => sum + r.mcv, 0);
    const sumFsv = records.reduce((sum, r) => sum + r.fsv, 0);

    return [{
      date: records[0].date,
      hour: '00',
      timeBlock: 'Daily',
      intervalNumber: 1,
      purchaseBid: Math.round(sumPurchase / records.length),
      sellBid: Math.round(sumSell / records.length),
      mcv: Math.round(sumMcv / records.length),
      fsv: Math.round(sumFsv / records.length),
      mcp: parseFloat((sumMcp / records.length).toFixed(2))
    }];
  }

  /**
   * Fetch Price Forecast
   */
  public static async getPriceForecast(market: string, startDateStr: string, endDateStr: string, interval: string = '15min', model: string = 'Model1') {
    const intervals: ForecastIntervalData[] = [];

    if (market.toUpperCase() === 'DAM') {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT * FROM "forecasting"."dam_forecasting"
           WHERE timestamp::date >= $1::date AND timestamp::date <= $2::date
           ORDER BY timestamp ASC;`,
          startDateStr,
          endDateStr
        );

        if (rows && rows.length > 0) {
          const formatted = rows.map(r => {
            const hourNum = Math.floor((r.time_block - 1) / 4) + 1;
            const hour = hourNum.toString().padStart(2, '0');
            const timeBlock = this.getIntervalTime(r.time_block);
            
            // predicted_mcp is stored in Rs/MWh. Convert to Rs/kWh by dividing by 1000.0
            const mcp = parseFloat((Number(r.predicted_mcp) / 1000.0).toFixed(2));
            
            const dateStr = r.timestamp instanceof Date 
              ? r.timestamp.toISOString().split('T')[0] 
              : new Date(r.timestamp).toISOString().split('T')[0];

            return {
              date: dateStr,
              hour,
              timeBlock,
              intervalNumber: r.time_block,
              purchaseBid: 0,
              sellBid: 0,
              mcv: 0,
              fsv: 0,
              mcp
            };
          });

          intervals.push(...this.aggregatePriceIntervals(formatted, interval));
        }
      } catch (e) {
        console.error('[ForecastService] Error querying dam_forecasting:', e);
      }
    }

    // Compute analytics
    let sumMcp = 0;
    let sumFsv = 0;
    let maxMcp = -Infinity;
    let minMcp = Infinity;
    let maxMcv = -Infinity;
    let maxFsv = -Infinity;

    for (const row of intervals) {
      const mcp = Number(row.mcp || 0);
      const fsv = Number(row.fsv || 0);
      const mcv = Number(row.mcv || 0);

      sumMcp += mcp;
      sumFsv += fsv;
      if (mcp > maxMcp) maxMcp = mcp;
      if (mcp < minMcp) minMcp = mcp;
      if (mcv > maxMcv) maxMcv = mcv;
      if (fsv > maxFsv) maxFsv = fsv;
    }

    const averageMcp = intervals.length > 0 ? sumMcp / intervals.length : 0;

    return {
      intervals,
      analytics: {
        averageMcp: parseFloat(averageMcp.toFixed(2)),
        totalVolume: parseFloat(sumFsv.toFixed(2)),
        maxMcv: maxMcv === -Infinity ? 0 : maxMcv,
        maxFsv: maxFsv === -Infinity ? 0 : maxFsv,
        maxMcp: maxMcp === -Infinity ? 0 : parseFloat(maxMcp.toFixed(2)),
        minMcp: minMcp === Infinity ? 0 : parseFloat(minMcp.toFixed(2))
      }
    };
  }

  /**
   * Fetch Demand Forecast
   */
  public static async getDemandForecast(type: string, startDateStr: string, endDateStr: string, interval: string = '15min') {
    const dates = this.getDatesInRange(startDateStr, endDateStr);
    const intervals: DemandForecastIntervalData[] = [];

    // Base params
    const isAllIndia = type === 'all-india';
    let baseLoad = isAllIndia ? 160000 : 150; // All India load in MW, Consumer load in kW
    let peakMultiplier = isAllIndia ? 40000 : 80;

    // Check database if there is existing state/all India demand data or savings calculator client data
    try {
      if (isAllIndia) {
        const dbDemand = await prisma.stateDemandData.findMany({
          where: {
            date: { gte: startDateStr, lte: endDateStr }
          }
        });

        if (dbDemand && dbDemand.length > 0) {
          // Aggregate by date & timeStr, apply 1.04 forecast multiplier
          const grouped = dbDemand.reduce((acc, curr) => {
            const key = `${curr.date}_${curr.timeStr}`;
            if (!acc[key]) acc[key] = { date: curr.date, time: curr.timeStr, sum: 0 };
            acc[key].sum += curr.demand;
            return acc;
          }, {} as Record<string, { date: string; time: string; sum: number }>);

          const formatted = Object.values(grouped).map((g: any, index: number) => {
            const hour = g.time.split(':')[0];
            return {
              date: g.date,
              hour,
              timeBlock: g.time,
              intervalNumber: index + 1,
              demand: Math.round(g.sum * 1.04), // +4% demand growth
              frequency: parseFloat((49.9 + Math.random() * 0.2).toFixed(2))
            };
          });
          intervals.push(...this.aggregateDemandIntervals(formatted, interval));
        }
      } else {
        // Consumer demand
        const savingsEntries = await prisma.savingsCalculatorEntry.findMany();
        if (savingsEntries && savingsEntries.length > 0) {
          const entry = savingsEntries[0];
          const load = entry.sanctionedLoadKw ? Number(entry.sanctionedLoadKw) : 100;
          baseLoad = load * 0.6;
          peakMultiplier = load * 0.35;
        }
      }
    } catch (e) {
      console.warn('[ForecastService] Error querying DB for demand, using simulation:', e);
    }



    // Analytics computation
    let sumDemand = 0;
    let maxDemand = -Infinity;
    let minDemand = Infinity;

    for (const row of intervals) {
      const dem = row.demand;
      sumDemand += dem;
      if (dem > maxDemand) maxDemand = dem;
      if (dem < minDemand) minDemand = dem;
    }

    const averageDemand = intervals.length > 0 ? sumDemand / intervals.length : 0;

    return {
      intervals,
      analytics: {
        averageDemand: Math.round(averageDemand),
        maxDemand: maxDemand === -Infinity ? 0 : maxDemand,
        minDemand: minDemand === Infinity ? 0 : minDemand,
        totalEnergyKwh: Math.round(sumDemand * 0.25) // assuming 15min intervals for total energy integration
      }
    };
  }

  private static aggregateDemandIntervals(records: DemandForecastIntervalData[], interval: string): DemandForecastIntervalData[] {
    if (interval === '15min') return records;

    if (interval === 'hourly') {
      const hourlyData: DemandForecastIntervalData[] = [];
      for (let h = 0; h < 24; h++) {
        const hourStr = h.toString().padStart(2, '0');
        const hourRecords = records.filter(r => parseInt(r.hour) === h + 1);
        if (hourRecords.length === 0) continue;

        const sumDemand = hourRecords.reduce((sum, r) => sum + r.demand, 0);
        const sumFreq = hourRecords.reduce((sum, r) => sum + (r.frequency || 0), 0);

        hourlyData.push({
          date: hourRecords[0].date,
          hour: hourStr,
          timeBlock: `${hourStr}:00`,
          intervalNumber: h + 1,
          demand: Math.round(sumDemand / hourRecords.length),
          frequency: hourRecords[0].frequency ? parseFloat((sumFreq / hourRecords.length).toFixed(2)) : undefined
        });
      }
      return hourlyData;
    }

    // Daily
    const sumDemand = records.reduce((sum, r) => sum + r.demand, 0);
    const sumFreq = records.reduce((sum, r) => sum + (r.frequency || 0), 0);

    return [{
      date: records[0].date,
      hour: '00',
      timeBlock: 'Daily',
      intervalNumber: 1,
      demand: Math.round(sumDemand / records.length),
      frequency: records[0].frequency ? parseFloat((sumFreq / records.length).toFixed(2)) : undefined
    }];
  }

  /**
   * Get available forecast dates from database
   */
  public static async getForecastDates(market: string): Promise<string[]> {
    if (market.toUpperCase() === 'DAM') {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT DISTINCT timestamp::date AS date 
           FROM "forecasting"."dam_forecasting" 
           ORDER BY date DESC;`
        );
        return rows.map(r => {
          const d = r.date;
          if (d instanceof Date) {
            return d.toISOString().split('T')[0];
          }
          return new Date(d).toISOString().split('T')[0];
        });
      } catch (e) {
        console.error('[ForecastService] Error querying available forecast dates:', e);
        return [];
      }
    }
    return [];
  }
}
