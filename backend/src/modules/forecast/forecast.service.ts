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
  mcp: number | null;
  mcpDayahead?: number | null;
  mcpNowcast?: number | null;
  actualMcp?: number | null;
  confidence?: string;
  priceRange?: string;
}

export interface DemandForecastIntervalData {
  date: string;
  hour: string;
  timeBlock: string;
  intervalNumber: number;
  demand: number; // in MW or kW
  actualDemand?: number | null;
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

        const mcpRecords = hourRecords.filter(r => r.mcp !== null);
        const sumMcp = mcpRecords.reduce((sum, r) => sum + (r.mcp as number), 0);
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

        // Aggregate dayahead
        const dayaheadRecords = hourRecords.filter(r => r.mcpDayahead !== null && r.mcpDayahead !== undefined);
        const sumDayahead = dayaheadRecords.reduce((sum, r) => sum + (r.mcpDayahead as number), 0);
        const mcpDayahead = dayaheadRecords.length > 0 ? parseFloat((sumDayahead / dayaheadRecords.length).toFixed(2)) : null;

        // Aggregate nowcast
        const nowcastRecords = hourRecords.filter(r => r.mcpNowcast !== null && r.mcpNowcast !== undefined);
        const sumNowcast = nowcastRecords.reduce((sum, r) => sum + (r.mcpNowcast as number), 0);
        const mcpNowcast = nowcastRecords.length > 0 ? parseFloat((sumNowcast / nowcastRecords.length).toFixed(2)) : null;

        hourlyData.push({
          date: hourRecords[0].date,
          hour: hourStr,
          timeBlock: `${hourStr}:00`,
          intervalNumber: h + 1,
          purchaseBid: Math.round(sumPurchase / hourRecords.length),
          sellBid: Math.round(sumSell / hourRecords.length),
          mcv: Math.round(sumMcv / hourRecords.length),
          fsv: Math.round(sumFsv / hourRecords.length),
          mcp: mcpRecords.length > 0 ? parseFloat((sumMcp / mcpRecords.length).toFixed(2)) : null,
          mcpDayahead,
          mcpNowcast,
          actualMcp,
          confidence
        });
      }
      return hourlyData;
    }

    // Daily aggregation
    const mcpRecords = records.filter(r => r.mcp !== null);
    const sumMcp = mcpRecords.reduce((sum, r) => sum + (r.mcp as number), 0);
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

    // Aggregate dayahead
    const dayaheadRecords = records.filter(r => r.mcpDayahead !== null && r.mcpDayahead !== undefined);
    const sumDayahead = dayaheadRecords.reduce((sum, r) => sum + (r.mcpDayahead as number), 0);
    const mcpDayahead = dayaheadRecords.length > 0 ? parseFloat((sumDayahead / dayaheadRecords.length).toFixed(2)) : null;

    // Aggregate nowcast
    const nowcastRecords = records.filter(r => r.mcpNowcast !== null && r.mcpNowcast !== undefined);
    const sumNowcast = nowcastRecords.reduce((sum, r) => sum + (r.mcpNowcast as number), 0);
    const mcpNowcast = nowcastRecords.length > 0 ? parseFloat((sumNowcast / nowcastRecords.length).toFixed(2)) : null;

    return [{
      date: records[0].date,
      hour: '00',
      timeBlock: 'Daily',
      intervalNumber: 1,
      purchaseBid: Math.round(sumPurchase / records.length),
      sellBid: Math.round(sumSell / records.length),
      mcv: Math.round(sumMcv / records.length),
      fsv: Math.round(sumFsv / records.length),
      mcp: mcpRecords.length > 0 ? parseFloat((sumMcp / mcpRecords.length).toFixed(2)) : null,
      mcpDayahead,
      mcpNowcast,
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
              confidence: r.confidence_pct !== undefined && r.confidence_pct !== null ? String(r.confidence_pct) : 'N/A',
              priceRange: r.price_range || 'N/A'
            };
          });

          intervals.push(...this.aggregatePriceIntervals(formatted, interval));
        }
      } catch (e) {
        console.error('[ForecastService] Error querying dam_forecasting:', e);
      }
    } else if (market.toUpperCase() === 'GDAM' || market.toUpperCase() === 'RTM') {
      try {
        const isGdam = market.toUpperCase() === 'GDAM';
        
        // Fetch actuals for mapping
        const actualRows: any[] = await prisma.$queryRawUnsafe(
          `SELECT d."deliveryDate" as date, dr."intervalNumber" as timeblock, dr.mcp 
           FROM "${isGdam ? 'GdamRecord' : 'RtmRecord'}" dr 
           JOIN "Dataset" d ON dr."datasetId" = d.id 
           WHERE d.market = $1::"MarketType" AND d.status = 'ACTIVE'
           AND d."deliveryDate" >= $2::date AND d."deliveryDate" <= $3::date;`,
          isGdam ? 'GDAM' : 'RTM',
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

        // Fetch forecast
        if (isGdam) {
          const forecastRows = await prisma.forecastGdam.findMany({
            where: { date: { gte: startDateStr, lte: endDateStr } },
            orderBy: [{ date: 'asc' }, { intervalNumber: 'asc' }]
          });
          
          if (forecastRows && forecastRows.length > 0) {
            const formatted = forecastRows.map((r: any) => {
              const hourNum = Math.floor((r.intervalNumber - 1) / 4) + 1;
              const hour = hourNum.toString().padStart(2, '0');
              const timeBlock = this.getIntervalTime(r.intervalNumber);
              
              const mcp = r.mcp !== null && r.mcp !== undefined ? parseFloat((Number(r.mcp) / 1000.0).toFixed(2)) : null;
              
              const dateStr = r.date;
              const key = `${dateStr}_${r.intervalNumber}`;
              const actualMcp = actualMap.has(key) ? actualMap.get(key) : null;

              return {
                date: dateStr,
                hour,
                timeBlock,
                intervalNumber: r.intervalNumber,
                purchaseBid: Number(r.purchaseBid),
                sellBid: Number(r.sellBid),
                mcv: Number(r.mcv),
                fsv: Number(r.fsv),
                mcp,
                actualMcp,
                confidence: 'N/A'
              };
            });
            intervals.push(...this.aggregatePriceIntervals(formatted, interval));
          }
        } else {
          // RTM uses Prisma Model
          const [dayaheadRows, nowcastRows] = await Promise.all([
            prisma.rtmDayahead.findMany({
              where: { date: { gte: startDateStr, lte: endDateStr } },
              orderBy: [{ date: 'asc' }, { intervalNumber: 'asc' }]
            }),
            prisma.rtmNowcast.findMany({
              where: { date: { gte: startDateStr, lte: endDateStr } },
              orderBy: [{ date: 'asc' }, { intervalNumber: 'asc' }, { forecastedAt: 'asc' }] // ascending so last overwrites
            })
          ]);
          
          const dayaheadMap = new Map();
          for (const r of dayaheadRows) {
            dayaheadMap.set(`${r.date}_${r.intervalNumber}`, r);
          }
          
          const nowcastMap = new Map();
          for (const r of nowcastRows) {
            nowcastMap.set(`${r.date}_${r.intervalNumber}`, r);
          }

          const dates = this.getDatesInRange(startDateStr, endDateStr);
          const rawFormatted = [];
          
          for (const dStr of dates) {
            for (let t = 1; t <= 96; t++) {
              const key = `${dStr}_${t}`;
              const dRow = dayaheadMap.get(key);
              const nRow = nowcastMap.get(key);
              const actMcp = actualMap.has(key) ? actualMap.get(key) : null;
              
              if (!dRow && !nRow && actMcp === null) {
                continue; // no data for this block
              }
              
              const hourNum = Math.floor((t - 1) / 4) + 1;
              const hour = hourNum.toString().padStart(2, '0');
              const timeBlock = this.getIntervalTime(t);
              
              const mcpDayahead = dRow?.predictedMcp !== null && dRow?.predictedMcp !== undefined ? parseFloat((Number(dRow.predictedMcp) / 1000.0).toFixed(2)) : null;
              const mcpNowcast = nRow?.predictedMcp !== null && nRow?.predictedMcp !== undefined ? parseFloat((Number(nRow.predictedMcp) / 1000.0).toFixed(2)) : null;

              rawFormatted.push({
                date: dStr,
                hour,
                timeBlock,
                intervalNumber: t,
                purchaseBid: 0,
                sellBid: 0,
                mcv: 0,
                fsv: 0,
                mcp: null, // rtm_forecasting removed
                mcpDayahead,
                mcpNowcast,
                actualMcp: actMcp,
                confidence: 'N/A'
              });
            }
          }
          
          if (rawFormatted.length > 0) {
            intervals.push(...this.aggregatePriceIntervals(rawFormatted, interval));
          }
        }
      } catch (e) {
         console.error(`[ForecastService] Error querying ${market} forecasting:`, e);
      }
    }

    // If no forecast intervals were created, but we have actual data, let's create intervals for them
    // Note: for RTM this shouldn't happen because we iterate all 96 blocks in the RTM branch if there is any data.
    // This mostly applies to GDAM now.
    if (intervals.length === 0 && actualMap.size > 0) {
      const defaultFormatted = [];
      for (const [key, actualMcp] of actualMap.entries()) {
        const [dStr, tStr] = key.split('_');
        const t = parseInt(tStr);
        const hourNum = Math.floor((t - 1) / 4) + 1;
        const hour = hourNum.toString().padStart(2, '0');
        const timeBlock = this.getIntervalTime(t);
        defaultFormatted.push({
          date: dStr,
          hour,
          timeBlock,
          intervalNumber: t,
          purchaseBid: 0,
          sellBid: 0,
          mcv: 0,
          fsv: 0,
          mcp: null,
          actualMcp: actualMcp,
          confidence: 'N/A',
          priceRange: 'N/A'
        });
      }
      // Sort defaultFormatted by date then interval
      defaultFormatted.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.intervalNumber - b.intervalNumber;
      });
      intervals.push(...this.aggregatePriceIntervals(defaultFormatted, interval));
    }

    // Compute analytics
    let sumMcp = 0;
    let sumActualMcp = 0;
    let actualCount = 0;
    let forecastCount = 0;
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
      const mcp = row.mcp !== null && row.mcp !== undefined ? Number(row.mcp) : null;
      const actualMcp = row.actualMcp !== null && row.actualMcp !== undefined ? Number(row.actualMcp) : null;
      const fsv = Number(row.fsv || 0);
      const mcv = Number(row.mcv || 0);

      if (mcp !== null) {
        sumMcp += mcp;
        forecastCount++;
        if (mcp > maxMcp) maxMcp = mcp;
        if (mcp < minForecastMcp) minForecastMcp = mcp;
      }
      sumFsv += fsv;
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
        if (mcp !== null) {
          const absErr = Math.abs(actualMcp - mcp);
          sumAbsoluteError += absErr;

          if (actualMcp > 0) {
            sumPercentageError += (absErr / actualMcp);
            errorCount++;
          }
        }
      }
    }

    const averageMcpForecasted = forecastCount > 0 ? sumMcp / forecastCount : 0;
    const averageMcpActual = actualCount > 0 ? sumActualMcp / actualCount : null;
    const minMcpForecasted = minForecastMcp === Infinity ? 0 : minForecastMcp;
    const minMcpActual = minActualMcp === Infinity ? null : minActualMcp;

    const mae = actualCount > 0 ? sumAbsoluteError / actualCount : null;
    const mape = errorCount > 0 ? (sumPercentageError / errorCount) * 100 : null;
    const wmape = sumActualMcp > 0 ? (sumAbsoluteError / sumActualMcp) * 100 : null;

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
        wmape: wmape !== null ? `${wmape.toFixed(2)}%` : 'N/A',
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

    try {
      if (isAllIndia) {
        const records = await prisma.forecastAllIndiaDemand.findMany({
          where: { date: { in: dates } },
          orderBy: [{ date: 'asc' }, { intervalNumber: 'asc' }]
        });

        if (records && records.length > 0) {
          const formatted = records.map(r => ({
            date: r.date,
            hour: r.hour,
            timeBlock: r.timeBlock,
            intervalNumber: r.intervalNumber,
            demand: Number(r.forecastedDemand),
            actualDemand: r.actualDemand !== null ? Number(r.actualDemand) : null
          }));
          intervals.push(...this.aggregateDemandIntervals(formatted, interval));
        }
      } else {
        // Consumer demand
        const records = await prisma.forecastConsumerDemand.findMany({
          where: { date: { in: dates } },
          orderBy: [{ date: 'asc' }, { intervalNumber: 'asc' }]
        });

        if (records && records.length > 0) {
          const formatted = records.map(r => ({
            date: r.date,
            hour: r.hour,
            timeBlock: r.timeBlock,
            intervalNumber: r.intervalNumber,
            demand: Number(r.forecastedApparentEnergy),
            actualDemand: r.actualApparentEnergy !== null ? Number(r.actualApparentEnergy) : null
          }));
          intervals.push(...this.aggregateDemandIntervals(formatted, interval));
        }
      }
    } catch (e) {
      console.warn('[ForecastService] Error querying DB for demand:', e);
    }



    // Analytics computation
    let sumDemand = 0;
    let maxDemand = -Infinity;
    let minDemand = Infinity;

    let sumActualDemand = 0;
    let sumAbsoluteError = 0;
    let sumPercentageError = 0;
    let errorCount = 0;
    let actualCount = 0;

    for (const row of intervals) {
      const dem = row.demand;
      const actual = row.actualDemand !== null && row.actualDemand !== undefined ? Number(row.actualDemand) : null;
      
      sumDemand += dem;
      if (dem > maxDemand) maxDemand = dem;
      if (dem < minDemand) minDemand = dem;

      if (actual !== null) {
        sumActualDemand += actual;
        actualCount++;
        const absErr = Math.abs(actual - dem);
        sumAbsoluteError += absErr;
        
        if (actual > 0) {
          sumPercentageError += (absErr / actual);
          errorCount++;
        }
      }
    }

    const averageDemand = intervals.length > 0 ? sumDemand / intervals.length : 0;
    const mae = actualCount > 0 ? sumAbsoluteError / actualCount : null;
    const mape = errorCount > 0 ? (sumPercentageError / errorCount) * 100 : null;
    const wmape = sumActualDemand > 0 ? (sumAbsoluteError / sumActualDemand) * 100 : null;

    return {
      intervals,
      analytics: {
        averageDemand: Math.round(averageDemand),
        maxDemand: maxDemand === -Infinity ? 0 : maxDemand,
        minDemand: minDemand === Infinity ? 0 : minDemand,
        totalEnergyKwh: Math.round(sumDemand * 0.25), // assuming 15min intervals for total energy integration
        mape: mape !== null ? `${mape.toFixed(2)}%` : 'N/A',
        mae: mae !== null ? parseFloat(mae.toFixed(2)) : 'N/A',
        wmape: wmape !== null ? `${wmape.toFixed(2)}%` : 'N/A'
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

        const sumActual = hourRecords.filter(r => r.actualDemand !== null && r.actualDemand !== undefined).reduce((sum, r) => sum + (r.actualDemand as number), 0);
        const countActual = hourRecords.filter(r => r.actualDemand !== null && r.actualDemand !== undefined).length;

        hourlyData.push({
          date: hourRecords[0].date,
          hour: hourStr,
          timeBlock: `${hourStr}:00`,
          intervalNumber: h + 1,
          demand: Math.round(sumDemand / hourRecords.length),
          actualDemand: countActual > 0 ? Math.round(sumActual / countActual) : null,
          frequency: hourRecords[0].frequency ? parseFloat((sumFreq / hourRecords.length).toFixed(2)) : undefined
        });
      }
      return hourlyData;
    }

    // Daily
    const sumDemand = records.reduce((sum, r) => sum + r.demand, 0);
    const sumFreq = records.reduce((sum, r) => sum + (r.frequency || 0), 0);
    const sumActual = records.filter(r => r.actualDemand !== null && r.actualDemand !== undefined).reduce((sum, r) => sum + (r.actualDemand as number), 0);
    const countActual = records.filter(r => r.actualDemand !== null && r.actualDemand !== undefined).length;

    return [{
      date: records[0].date,
      hour: '00',
      timeBlock: 'Daily',
      intervalNumber: 1,
      demand: Math.round(sumDemand / records.length),
      actualDemand: countActual > 0 ? Math.round(sumActual / countActual) : null,
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
    } else if (market.toUpperCase() === 'GDAM') {
      try {
        const rows = await prisma.forecastGdam.findMany({
          select: { date: true },
          distinct: ['date'],
          orderBy: { date: 'desc' }
        });
        return rows.map(r => r.date);
      } catch (e) { 
        console.error('[ForecastService] Error in GDAM dates:', e);
        return []; 
      }
    } else if (market.toUpperCase() === 'RTM') {
      try {
        const rows = await prisma.rtmDayahead.findMany({
          select: { date: true },
          distinct: ['date'],
          orderBy: { date: 'desc' }
        });
        return rows.map((r: any) => r.date);
      } catch (e) { return []; }
    } else if (market.toUpperCase() === 'CONSUMER') {
      try {
        const rows = await prisma.forecastConsumerDemand.findMany({
          select: { date: true },
          distinct: ['date'],
          orderBy: { date: 'desc' }
        });
        return rows.map(r => r.date);
      } catch (e) { return []; }
    } else if (market.toUpperCase() === 'ALL-INDIA') {
      try {
        const rows = await prisma.forecastAllIndiaDemand.findMany({
          select: { date: true },
          distinct: ['date'],
          orderBy: { date: 'desc' }
        });
        return rows.map(r => r.date);
      } catch (e) { return []; }
    }
    return [];
  }
}
