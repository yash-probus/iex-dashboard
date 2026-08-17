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
          
          const forecastMap = new Map();
          for (const r of forecastRows) {
            forecastMap.set(`${r.date}_${r.intervalNumber}`, r);
          }
          
          const dates = this.getDatesInRange(startDateStr, endDateStr);
          const rawFormatted = [];
          
          for (const dStr of dates) {
            for (let t = 1; t <= 96; t++) {
              const key = `${dStr}_${t}`;
              const fRow = forecastMap.get(key);
              const actMcp = actualMap.has(key) ? actualMap.get(key) : null;
              
              if (!fRow && actMcp === null) {
                continue;
              }
              
              const hourNum = Math.floor((t - 1) / 4) + 1;
              const hour = hourNum.toString().padStart(2, '0');
              const timeBlock = this.getIntervalTime(t);
              
              const mcp = fRow?.predictedMcp !== null && fRow?.predictedMcp !== undefined ? parseFloat((Number(fRow.predictedMcp) / 1000.0).toFixed(2)) : null;
              
              rawFormatted.push({
                date: dStr,
                hour,
                timeBlock,
                intervalNumber: t,
                purchaseBid: fRow ? Number(fRow.purchaseBid) : 0,
                sellBid: fRow ? Number(fRow.sellBidTotal || fRow.sellBid || 0) : 0,
                mcv: fRow ? Number(fRow.mcvTotal || fRow.mcv || 0) : 0,
                fsv: fRow ? Number(fRow.fsvTotal || fRow.fsv || 0) : 0,
                mcp,
                actualMcp: actMcp,
                confidence: 'N/A'
              });
            }
          }
          
          if (rawFormatted.length > 0) {
            intervals.push(...this.aggregatePriceIntervals(rawFormatted, interval));
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

              const confidenceDayahead = dRow?.confidence !== null && dRow?.confidence !== undefined ? String(dRow.confidence) : 'N/A';
              const priceRangeDayahead = dRow?.price_range || 'N/A';
              const confidenceNowcast = nRow?.confidence !== null && nRow?.confidence !== undefined ? String(nRow.confidence) : 'N/A';
              const priceRangeNowcast = nRow?.price_range || 'N/A';

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
                confidenceDayahead,
                priceRangeDayahead,
                confidenceNowcast,
                priceRangeNowcast,
                confidence: 'N/A',
                priceRange: 'N/A'
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
      let mcpVal: any = row.mcp;
      if (mcpVal === null || mcpVal === undefined) {
        // Fallback to mcpDayahead for RTM Forecast
        mcpVal = row.mcpDayahead;
      }
      const mcp = (mcpVal !== null && mcpVal !== undefined) ? Number(mcpVal) : null;
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
        // Build the timestamp range based on dates array (assumed dates are in IST, so we parse properly)
        const startDate = new Date(`${dates[0]}T00:00:00+05:30`);
        const endDate = new Date(`${dates[dates.length - 1]}T23:59:59+05:30`);

        const [records, actualRecords] = await Promise.all([
          prisma.forecastAllIndiaDemandV2.findMany({
            where: { 
              timestamp: { 
                gte: startDate,
                lte: endDate
              } 
            },
            orderBy: [{ timestamp: 'asc' }]
          }),
          prisma.nppAdjustedDemandData.findMany({
            where: { date: { in: dates } }
          }).then(res => res.length > 0 ? res : prisma.nppRawDemandData.findMany({ where: { date: { in: dates } } }))
        ]);

        const actualMap = new Map<string, number>();
        actualRecords.forEach((a: any) => {
          const tStr = a.timeStr ? (a.timeStr.includes(' ') ? a.timeStr.split(' ')[0] : a.timeStr) : '';
          if (tStr) actualMap.set(`${a.date}_${tStr}`, Number(a.demandMet));
          if (a.timeStr) actualMap.set(`${a.date}_${a.timeStr}`, Number(a.demandMet));
        });

        if (records && records.length > 0) {
          const formatted = records.map(r => {
            // Convert to IST string for UI mapping
            const d = new Date(r.timestamp);
            // using simple offset adjustment for UTC -> IST display mapping
            const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
            const dateStr = istDate.toISOString().split('T')[0];
            const hh = String(istDate.getUTCHours()).padStart(2, '0');
            const mm = String(istDate.getUTCMinutes()).padStart(2, '0');
            const hourStr = `${hh}:${mm}`;
            
            const nextMin = (istDate.getUTCMinutes() + 15) % 60;
            const nextHour = nextMin === 0 ? (istDate.getUTCHours() + 1) % 24 : istDate.getUTCHours();
            const timeBlock = `${hourStr} - ${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`;
            
            const minutes = istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
            const intervalNumber = Math.floor(minutes / 15) + 1;

            const forecastedVal = r.forecast_demand !== null ? Number(r.forecast_demand) : 0;
            const actualVal = actualMap.get(`${dateStr}_${hourStr}`) ?? actualMap.get(`${dateStr}_${intervalNumber}`) ?? null;

            return {
              date: dateStr,
              hour: hourStr,
              timeBlock: timeBlock,
              intervalNumber: intervalNumber,
              demand: forecastedVal,
              actualDemand: actualVal
            };
          });
          // Only keep intervals that match our requested dates
          const filtered = formatted.filter(f => dates.includes(f.date));
          intervals.push(...this.aggregateDemandIntervals(filtered, interval));
        }
      } else {
        // Consumer demand
        let formatted: DemandForecastIntervalData[] = [];

        try {
          const [records, actualRecords] = await Promise.all([
            prisma.$queryRawUnsafe(
              `SELECT timestamp, (timestamp::date)::text as date_str, slot_number, forecasted_energy, actual_energy
               FROM "forecasting"."consumer_demand_forecasting"
               WHERE (timestamp::date)::text = ANY($1::text[])
               ORDER BY timestamp ASC, slot_number ASC`,
              dates
            ) as Promise<any[]>,
            prisma.nppAdjustedDemandData.findMany({
              where: { date: { in: dates } }
            }).then(res => res.length > 0 ? res : prisma.nppRawDemandData.findMany({ where: { date: { in: dates } } }))
          ]);

          const actualMap = new Map<string, number>();
          actualRecords.forEach((a: any) => {
            const tStr = a.timeStr ? (a.timeStr.includes(' ') ? a.timeStr.split(' ')[0] : a.timeStr) : '';
            if (tStr) actualMap.set(`${a.date}_${tStr}`, Number(a.demandMet));
            if (a.timeStr) actualMap.set(`${a.date}_${a.timeStr}`, Number(a.demandMet));
          });

          formatted = records.map((r: any) => {
            const dateStr = r.date_str || (
              typeof r.timestamp === 'string'
                ? r.timestamp.split('T')[0]
                : new Date(r.timestamp).toISOString().split('T')[0]
            );

            const slotNum = Number(r.slot_number || 1);
            const startMins = (slotNum - 1) * 15;
            const endMins = slotNum * 15;

            const startH = String(Math.floor(startMins / 60) % 24).padStart(2, '0');
            const startM = String(startMins % 60).padStart(2, '0');
            const endH = String(Math.floor(endMins / 60) % 24).padStart(2, '0');
            const endM = String(endMins % 60).padStart(2, '0');

            const timeBlock = `${startH}:${startM} - ${endH}:${endM}`;
            const hourNum = Math.floor((slotNum - 1) / 4) + 1;

            const actualVal = r.actual_energy !== null && r.actual_energy !== undefined 
              ? Number(r.actual_energy) 
              : (actualMap.get(`${dateStr}_${startH}:${startM}`) ?? actualMap.get(`${dateStr}_${slotNum}`) ?? null);

            return {
              date: dateStr,
              hour: String(hourNum).padStart(2, '0'),
              timeBlock,
              intervalNumber: slotNum,
              demand: r.forecasted_energy !== null && r.forecasted_energy !== undefined 
                ? Number(r.forecasted_energy) 
                : (r.forecast_demand !== null && r.forecast_demand !== undefined ? Number(r.forecast_demand) : 0),
              actualDemand: actualVal
            };
          });
        } catch {
          // Legacy schema fallback (timestamp + forecast_demand)
          const records: any[] = await prisma.$queryRawUnsafe(
            `SELECT timestamp, (timestamp::date)::text as date_str, forecast_demand
             FROM "forecasting"."consumer_demand_forecasting"
             WHERE (timestamp::date)::text = ANY($1::text[])
             ORDER BY timestamp ASC`,
            dates
          );

          formatted = records.map((r: any, idx: number) => {
            const dateStr = r.date_str || (
              typeof r.timestamp === 'string'
                ? r.timestamp.split('T')[0]
                : new Date(r.timestamp).toISOString().split('T')[0]
            );

            const slotNum = idx + 1;
            const startMins = (slotNum - 1) * 15;
            const endMins = slotNum * 15;

            const startH = String(Math.floor(startMins / 60) % 24).padStart(2, '0');
            const startM = String(startMins % 60).padStart(2, '0');
            const endH = String(Math.floor(endMins / 60) % 24).padStart(2, '0');
            const endM = String(endMins % 60).padStart(2, '0');

            const timeBlock = `${startH}:${startM} - ${endH}:${endM}`;
            const hourNum = Math.floor((slotNum - 1) / 4) + 1;

            return {
              date: dateStr,
              hour: String(hourNum).padStart(2, '0'),
              timeBlock,
              intervalNumber: slotNum,
              demand: r.forecast_demand !== null && r.forecast_demand !== undefined ? Number(r.forecast_demand) : 0,
              actualDemand: null
            };
          });
        }

        if (formatted.length > 0) {
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

        const avgDemand = hourRecords.reduce((acc, r) => acc + r.demand, 0) / hourRecords.length;

        let avgActual: number | null = null;
        const validActuals = hourRecords.filter(r => r.actualDemand !== null && r.actualDemand !== undefined);
        if (validActuals.length > 0) {
          avgActual = validActuals.reduce((acc, r) => acc + (r.actualDemand || 0), 0) / validActuals.length;
        }

        hourlyData.push({
          date: hourRecords[0].date,
          hour: hourStr,
          timeBlock: `${hourStr}:00 - ${(h + 1).toString().padStart(2, '0')}:00`,
          intervalNumber: h + 1,
          demand: parseFloat(avgDemand.toFixed(2)),
          actualDemand: avgActual !== null ? parseFloat(avgActual.toFixed(2)) : null
        });
      }
      return hourlyData;
    }

    if (interval === 'daily') {
      const dailyMap: { [date: string]: DemandForecastIntervalData[] } = {};
      records.forEach(r => {
        if (!dailyMap[r.date]) dailyMap[r.date] = [];
        dailyMap[r.date].push(r);
      });

      return Object.keys(dailyMap).map(date => {
        const dateRecords = dailyMap[date];
        const avgDemand = dateRecords.reduce((acc, r) => acc + r.demand, 0) / dateRecords.length;

        let avgActual: number | null = null;
        const validActuals = dateRecords.filter(r => r.actualDemand !== null && r.actualDemand !== undefined);
        if (validActuals.length > 0) {
          avgActual = validActuals.reduce((acc, r) => acc + (r.actualDemand || 0), 0) / validActuals.length;
        }

        return {
          date,
          hour: '24',
          timeBlock: 'Full Day',
          intervalNumber: 1,
          demand: parseFloat(avgDemand.toFixed(2)),
          actualDemand: avgActual !== null ? parseFloat(avgActual.toFixed(2)) : null
        };
      });
    }

    return records;
  }

  static async getForecastDates(market: string): Promise<string[]> {
    return this.getAvailableDates(market);
  }

  // Common service method for date lookups
  static async getAvailableDates(market: string): Promise<string[]> {
    if (market.toUpperCase() === 'DAM') {
      try {
        const [forecastRows, actualRows] = await Promise.all([
          prisma.damForecasting.findMany({
            select: { forecasting_for: true },
            distinct: ['forecasting_for']
          }),
          prisma.dataset.findMany({
            where: { market: 'DAM', status: 'ACTIVE' },
            select: { deliveryDate: true },
            distinct: ['deliveryDate']
          })
        ]);

        const allDates = new Set<string>();
        forecastRows.forEach(r => {
          if (r.forecasting_for) {
            const dStr = r.forecasting_for instanceof Date 
              ? r.forecasting_for.toISOString().split('T')[0] 
              : new Date(r.forecasting_for).toISOString().split('T')[0];
            allDates.add(dStr);
          }
        });
        actualRows.forEach(r => {
          if (r.deliveryDate) {
            const dStr = r.deliveryDate instanceof Date 
              ? r.deliveryDate.toISOString().split('T')[0] 
              : new Date(r.deliveryDate).toISOString().split('T')[0];
            allDates.add(dStr);
          }
        });
        return Array.from(allDates).sort((a, b) => b.localeCompare(a));
      } catch (e) { 
        console.error('[ForecastService] Error in DAM dates:', e);
        return []; 
      }
    } else if (market.toUpperCase() === 'GDAM') {
      try {
        const [forecastRows, actualRows] = await Promise.all([
          prisma.forecastGdam.findMany({
            select: { date: true },
            distinct: ['date']
          }),
          prisma.dataset.findMany({
            where: { market: 'GDAM', status: 'ACTIVE' },
            select: { deliveryDate: true },
            distinct: ['deliveryDate']
          })
        ]);
        const allDates = new Set<string>();
        forecastRows.forEach(r => allDates.add(r.date));
        actualRows.forEach(r => {
          if (r.deliveryDate) {
            const dStr = r.deliveryDate instanceof Date 
              ? r.deliveryDate.toISOString().split('T')[0] 
              : new Date(r.deliveryDate).toISOString().split('T')[0];
            allDates.add(dStr);
          }
        });
        return Array.from(allDates).sort((a, b) => b.localeCompare(a));
      } catch (e) { 
        console.error('[ForecastService] Error in GDAM dates:', e);
        return []; 
      }
    } else if (market.toUpperCase() === 'RTM') {
      try {
        const [dayaheadRows, nowcastRows, actualRows] = await Promise.all([
          prisma.rtmDayahead.findMany({
            select: { date: true },
            distinct: ['date']
          }),
          prisma.rtmNowcast.findMany({
            select: { date: true },
            distinct: ['date']
          }),
          prisma.dataset.findMany({
            where: { market: 'RTM', status: 'ACTIVE' },
            select: { deliveryDate: true },
            distinct: ['deliveryDate']
          })
        ]);
        const allDates = new Set<string>();
        dayaheadRows.forEach(r => allDates.add(r.date));
        nowcastRows.forEach(r => allDates.add(r.date));
        actualRows.forEach(r => {
          const dStr = r.deliveryDate instanceof Date 
            ? r.deliveryDate.toISOString().split('T')[0] 
            : new Date(r.deliveryDate).toISOString().split('T')[0];
          allDates.add(dStr);
        });
        return Array.from(allDates).sort((a, b) => b.localeCompare(a));
      } catch (e) { return []; }
    } else if (market.toUpperCase() === 'CONSUMER') {
      try {
        const rows: Array<{ date_str: string }> = await prisma.$queryRawUnsafe(
          `SELECT DISTINCT (timestamp::date)::text as date_str
           FROM "forecasting"."consumer_demand_forecasting"
           WHERE timestamp IS NOT NULL
           ORDER BY date_str DESC`
        );
        return rows.map(r => r.date_str);
      } catch (e) { return []; }
    } else if (market.toUpperCase() === 'ALL-INDIA') {
      try {
        const rows = await prisma.forecastAllIndiaDemandV2.findMany({
          select: { timestamp: true },
          orderBy: { timestamp: 'desc' }
        });
        const allDates = new Set<string>();
        rows.forEach(r => {
          const istDate = new Date(r.timestamp.getTime() + (5.5 * 60 * 60 * 1000));
          allDates.add(istDate.toISOString().split('T')[0]);
        });
        return Array.from(allDates);
      } catch (e) { return []; }
    }
    return [];
  }
}
