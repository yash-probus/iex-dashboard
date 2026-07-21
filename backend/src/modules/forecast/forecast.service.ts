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
  actualMcp?: number | null;
  confidence?: string;
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

        // Aggregate actualMcp
        const actualRecords = hourRecords.filter(r => r.actualMcp !== null && r.actualMcp !== undefined);
        const sumActualMcp = actualRecords.reduce((sum, r) => sum + (r.actualMcp || 0), 0);
        const actualMcp = actualRecords.length > 0 
          ? parseFloat((sumActualMcp / actualRecords.length).toFixed(2))
          : null;

        // Aggregate confidence
        const confRecords = hourRecords.filter(r => r.confidence !== 'N/A' && r.confidence !== undefined && r.confidence !== null);
        const sumConf = confRecords.reduce((sum, r) => sum + Number(r.confidence || 0), 0);
        const confidence = confRecords.length > 0
          ? (sumConf / confRecords.length).toFixed(2)
          : 'N/A';

        hourlyData.push({
          date: hourRecords[0].date,
          hour: hourStr,
          timeBlock: `${hourStr}:00`,
          intervalNumber: h + 1,
          purchaseBid: Math.round(sumPurchase / hourRecords.length),
          sellBid: Math.round(sumSell / hourRecords.length),
          mcv: Math.round(sumMcv / hourRecords.length),
          fsv: Math.round(sumFsv / hourRecords.length),
          mcp: parseFloat((sumMcp / hourRecords.length).toFixed(2)),
          actualMcp,
          confidence
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

    // Aggregate actualMcp
    const actualRecords = records.filter(r => r.actualMcp !== null && r.actualMcp !== undefined);
    const sumActualMcp = actualRecords.reduce((sum, r) => sum + (r.actualMcp || 0), 0);
    const actualMcp = actualRecords.length > 0 
      ? parseFloat((sumActualMcp / actualRecords.length).toFixed(2))
      : null;

    // Aggregate confidence
    const confRecords = records.filter(r => r.confidence !== 'N/A' && r.confidence !== undefined && r.confidence !== null);
    const sumConf = confRecords.reduce((sum, r) => sum + Number(r.confidence || 0), 0);
    const confidence = confRecords.length > 0
      ? (sumConf / confRecords.length).toFixed(2)
      : 'N/A';

    return [{
      date: records[0].date,
      hour: '00',
      timeBlock: 'Daily',
      intervalNumber: 1,
      purchaseBid: Math.round(sumPurchase / records.length),
      sellBid: Math.round(sumSell / records.length),
      mcv: Math.round(sumMcv / records.length),
      fsv: Math.round(sumFsv / records.length),
      mcp: parseFloat((sumMcp / records.length).toFixed(2)),
      actualMcp,
      confidence
    }];
  }

  /**
   * Fetch Price Forecast
   */
  public static async getPriceForecast(market: string, startDateStr: string, endDateStr: string, interval: string = '15min', model: string = 'Model1') {
    const intervals: ForecastIntervalData[] = [];
    const actualMap = new Map<string, number>();

    if (market.toUpperCase() === 'DAM') {
      try {
        let modelNum = 1;
        if (model === 'Model2') modelNum = 2;

        // Fetch actuals for mapping
        const actualRows: any[] = await prisma.$queryRawUnsafe(
          `SELECT d."deliveryDate" as date, dr."intervalNumber" as timeblock, dr.mcp 
           FROM "DamRecord" dr 
           JOIN "Dataset" d ON dr."datasetId" = d.id 
           WHERE d.market = 'DAM' AND d.status = 'ACTIVE'
           AND d."deliveryDate" >= $1::date AND d."deliveryDate" <= $2::date;`,
          startDateStr,
          endDateStr
        );

        for (const act of actualRows) {
          const dateStr = act.date instanceof Date 
            ? act.date.toISOString().split('T')[0] 
            : new Date(act.date).toISOString().split('T')[0];
          const key = `${dateStr}_${act.timeblock}`;
          actualMap.set(key, parseFloat((Number(act.mcp) / 1000.0).toFixed(2)));
        }

        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT DISTINCT ON (forecasting_for::date, time_block) * FROM "forecasting"."dam_forecasting"
           WHERE forecasting_for::date >= $1::date AND forecasting_for::date <= $2::date
           AND model_number = $3
           ORDER BY forecasting_for::date ASC, time_block ASC, forecast_date DESC;`,
          startDateStr,
          endDateStr,
          modelNum
        );

        if (rows && rows.length > 0) {
          const formatted = rows.map(r => {
            const hourNum = Math.floor((r.time_block - 1) / 4) + 1;
            const hour = hourNum.toString().padStart(2, '0');
            const timeBlock = this.getIntervalTime(r.time_block);
            
            // predicted_mcp is stored in Rs/MWh. Convert to Rs/kWh by dividing by 1000.0
            const mcp = parseFloat((Number(r.predicted_mcp) / 1000.0).toFixed(2));
            
            const dateStr = r.forecasting_for instanceof Date 
              ? r.forecasting_for.toISOString().split('T')[0] 
              : new Date(r.forecasting_for).toISOString().split('T')[0];

            const key = `${dateStr}_${r.time_block}`;
            const actualMcp = actualMap.has(key) ? actualMap.get(key) : null;

            return {
              date: dateStr,
              hour,
              timeBlock,
              intervalNumber: r.time_block,
              purchaseBid: 0,
              sellBid: 0,
              mcv: 0,
              fsv: 0,
              mcp,
              actualMcp,
              confidence: r.confidence_pct !== undefined && r.confidence_pct !== null ? String(r.confidence_pct) : 'N/A'
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
    let sumActualMcp = 0;
    let actualCount = 0;
    let sumFsv = 0;
    let maxMcp = -Infinity;
    let minForecastMcp = Infinity;
    let minActualMcp = Infinity;
    let maxMcv = -Infinity;
    let maxFsv = -Infinity;

    let sumAbsoluteError = 0;
    let sumPercentageError = 0;
    let errorCount = 0;
    
    let sumConfidence = 0;
    let confidenceCount = 0;

    for (const row of intervals) {
      const mcp = Number(row.mcp || 0);
      const actualMcp = row.actualMcp !== null && row.actualMcp !== undefined ? Number(row.actualMcp) : null;
      const fsv = Number(row.fsv || 0);
      const mcv = Number(row.mcv || 0);

      sumMcp += mcp;
      sumFsv += fsv;
      if (mcp > maxMcp) maxMcp = mcp;
      if (mcp < minForecastMcp) minForecastMcp = mcp;
      if (mcv > maxMcv) maxMcv = mcv;
      if (fsv > maxFsv) maxFsv = fsv;

      if (row.confidence !== 'N/A' && row.confidence !== null && row.confidence !== undefined) {
        sumConfidence += Number(row.confidence);
        confidenceCount++;
      }

      if (actualMcp !== null) {
        sumActualMcp += actualMcp;
        actualCount++;
        if (actualMcp < minActualMcp) minActualMcp = actualMcp;

        // Absolute error calculation
        const absErr = Math.abs(actualMcp - mcp);
        sumAbsoluteError += absErr;

        if (actualMcp > 0) {
          sumPercentageError += (absErr / actualMcp);
          errorCount++;
        }
      }
    }

    const averageMcpForecasted = intervals.length > 0 ? sumMcp / intervals.length : 0;
    const averageMcpActual = actualCount > 0 ? sumActualMcp / actualCount : null;
    const minMcpForecasted = minForecastMcp === Infinity ? 0 : minForecastMcp;
    const minMcpActual = minActualMcp === Infinity ? null : minActualMcp;

    const mae = actualCount > 0 ? sumAbsoluteError / actualCount : null;
    const mape = errorCount > 0 ? (sumPercentageError / errorCount) * 100 : null;

    return {
      intervals,
      analytics: {
        averageMcp: parseFloat(averageMcpForecasted.toFixed(2)),
        averageMcpForecasted: parseFloat(averageMcpForecasted.toFixed(2)),
        averageMcpActual: averageMcpActual !== null ? parseFloat(averageMcpActual.toFixed(2)) : 'N/A',
        totalVolume: parseFloat(sumFsv.toFixed(2)),
        maxMcv: maxMcv === -Infinity ? 0 : maxMcv,
        maxFsv: maxFsv === -Infinity ? 0 : maxFsv,
        maxMcp: maxMcp === -Infinity ? 0 : parseFloat(maxMcp.toFixed(2)),
        minMcp: minMcpForecasted === Infinity ? 0 : parseFloat(minMcpForecasted.toFixed(2)),
        minMcpForecasted: parseFloat(minMcpForecasted.toFixed(2)),
        minMcpActual: minMcpActual !== null ? parseFloat(minMcpActual.toFixed(2)) : 'N/A',
        mape: mape !== null ? `${mape.toFixed(2)}%` : 'N/A',
        mae: mae !== null ? parseFloat(mae.toFixed(2)) : 'N/A',
        avgAbsoluteError: mae !== null ? parseFloat(mae.toFixed(2)) : 'N/A',
        confidence: confidenceCount > 0 ? (sumConfidence / confidenceCount).toFixed(2) : 'N/A'
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
          `SELECT DISTINCT forecasting_for::date AS date 
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
