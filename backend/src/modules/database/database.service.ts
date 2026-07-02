import { PrismaClient } from '@prisma/client';
import { Response } from 'express';

const prisma = new PrismaClient();

// Defined interface for the bucket mapping structure
interface DemandBucket {
  total: number;
  count: number;
  max: number;
  min: number;
}

interface GenerationBucket {
  count: number;
  thermalTotal: number;
  gasTotal: number;
  nuclearTotal: number;
  hydroTotal: number;
  windTotal: number;
  solarTotal: number;
}

interface StateRegionMap {
  name: string;
  price: number | null;
  states: Array<{
    name: string;
    demand: number;
    unit: string;
  }>;
}

export class DatabaseService {
  async getWeatherData(startDate?: string, endDate?: string) {
    try {
      const forecasts = await prisma.weatherForecast.findMany({
        where: startDate && endDate
          ? { date: { gte: startDate, lte: endDate } }
          : startDate
          ? { date: { gte: startDate } }
          : endDate
          ? { date: { lte: endDate } }
          : undefined,
        orderBy: { date: 'asc' }
      });
      return forecasts;
    } catch (error: unknown) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  async getAllIndiaDemand(startDate?: string, endDate?: string) {
    try {
      const targetStartDate = startDate || new Date().toISOString().split('T')[0];
      const targetEndDate = endDate || targetStartDate;

      const rawRecords = await prisma.nppRawDemandData.findMany({
        where: {
          date: {
            gte: targetStartDate,
            lte: targetEndDate
          }
        },
        orderBy: [
          { date: 'asc' },
          { timeStr: 'asc' }
        ]
      });

      // Aggregate logic
      const adjustedMap: Record<string, DemandBucket> = {};

      for (const record of rawRecords) {
        const timePart = record.timeStr.includes(' ') ? record.timeStr.split(' ')[1] : record.timeStr;
        let [hh, mm] = timePart.split(':').map(Number);

        if (isNaN(hh) || isNaN(mm)) continue;
        if (hh === 24) hh = 0;

        // Calculate the 15-minute block label (e.g. 00:14)
        const blockStartMin = Math.floor(mm / 15) * 15;
        const blockEndMin = blockStartMin + 14;

        const adjustedTimeStr = `${record.date} ${String(hh).padStart(2, '0')}:${String(blockEndMin).padStart(2, '0')}`;

        if (!adjustedMap[adjustedTimeStr]) {
          adjustedMap[adjustedTimeStr] = {
            total: 0,
            count: 0,
            max: -Infinity,
            min: Infinity
          };
        }

        const bucket = adjustedMap[adjustedTimeStr];
        bucket.total += record.demandMet;
        bucket.count += 1;
        if (record.demandMet > bucket.max) bucket.max = record.demandMet;
        if (record.demandMet < bucket.min) bucket.min = record.demandMet;
      }

      const adjustedData = Object.keys(adjustedMap).sort().map(timeStr => {
        const bucket = adjustedMap[timeStr];
        return {
          timeStr,
          avgDemand: Math.round(bucket.total / bucket.count),
          maxDemand: bucket.max === -Infinity ? 0 : bucket.max,
          minDemand: bucket.min === Infinity ? 0 : bucket.min
        };
      });

      return {
        raw: rawRecords.map(r => ({
          ...r,
          timeStr: `${r.date} ${r.timeStr.includes(' ') ? r.timeStr.split(' ')[1] : r.timeStr}`,
          dataUpdatedAt: r.dataUpdatedAt,
          fetchedAt: r.fetchedAt
        })),
        adjusted: adjustedData
      };

    } catch (error: unknown) {
      console.error('Error fetching All India Demand (NPP):', error);
      throw error;
    }
  }

  async getGenerationData(startDate?: string, endDate?: string) {
    try {
      const targetStartDate = startDate || new Date().toISOString().split('T')[0];
      const targetEndDate = endDate || targetStartDate;

      const rawRecords = await prisma.nppRawGenerationData.findMany({
        where: {
          date: {
            gte: targetStartDate,
            lte: targetEndDate
          }
        },
        orderBy: [
          { date: 'asc' },
          { timeStr: 'asc' }
        ]
      });

      // Aggregate logic
      const adjustedMap: Record<string, GenerationBucket> = {};

      for (const record of rawRecords) {
        const timePart = record.timeStr.includes(' ') ? record.timeStr.split(' ')[1] : record.timeStr;
        let [hh, mm] = timePart.split(':').map(Number);

        if (isNaN(hh) || isNaN(mm)) continue;
        if (hh === 24) hh = 0;

        // Calculate the 15-minute block label (e.g. 00:14)
        const blockStartMin = Math.floor(mm / 15) * 15;
        const blockEndMin = blockStartMin + 14;

        const adjustedTimeStr = `${record.date} ${String(hh).padStart(2, '0')}:${String(blockEndMin).padStart(2, '0')}`;

        if (!adjustedMap[adjustedTimeStr]) {
          adjustedMap[adjustedTimeStr] = {
            count: 0,
            thermalTotal: 0, gasTotal: 0, nuclearTotal: 0, hydroTotal: 0, windTotal: 0, solarTotal: 0
          };
        }

        const bucket = adjustedMap[adjustedTimeStr];
        bucket.count += 1;
        bucket.thermalTotal += (record.thermal || 0);
        bucket.gasTotal += (record.gas || 0);
        bucket.nuclearTotal += (record.nuclear || 0);
        bucket.hydroTotal += (record.hydro || 0);
        bucket.windTotal += (record.wind || 0);
        bucket.solarTotal += (record.solar || 0);
      }

      const adjustedData = Object.keys(adjustedMap).sort().map(timeStr => {
        const bucket = adjustedMap[timeStr];
        return {
          timeStr,
          thermal: Math.round(bucket.thermalTotal / bucket.count),
          gas: Math.round(bucket.gasTotal / bucket.count),
          nuclear: Math.round(bucket.nuclearTotal / bucket.count),
          hydro: Math.round(bucket.hydroTotal / bucket.count),
          wind: Math.round(bucket.windTotal / bucket.count),
          solar: Math.round(bucket.solarTotal / bucket.count)
        };
      });

      return {
        raw: rawRecords.map(r => ({
          ...r,
          timeStr: `${r.date} ${r.timeStr}`
        })),
        adjusted: adjustedData
      };

    } catch (error: unknown) {
      console.error('Error fetching Generation Data:', error);
      throw error;
    }
  }

  async getStateWiseDemand(dateStr?: string, timeStr?: string) {
    try {
      let finalDateStr = dateStr;
      let finalTimeStr = timeStr;

      // If date/time not provided, find the most recent record's date and time
      if (!finalDateStr || !finalTimeStr) {
        const latest = await prisma.stateDemandData.findFirst({
          orderBy: [
            { date: 'desc' },
            { timeStr: 'desc' }
          ]
        });

        if (latest) {
          finalDateStr = latest.date;
          finalTimeStr = latest.timeStr;
        } else {
          // Fallback if DB is empty
          finalDateStr = new Date().toISOString().split('T')[0];
          finalTimeStr = "00:00";
        }
      }

      const allStates = await prisma.stateDemandData.findMany({
        where: {
          date: finalDateStr,
          timeStr: finalTimeStr
        }
      });

      // Group by region
      const regionsMap: Record<string, StateRegionMap> = {};

      for (const state of allStates) {
        if (!regionsMap[state.region]) {
          regionsMap[state.region] = {
            name: state.region,
            price: state.price,
            states: []
          };
        }
        regionsMap[state.region].states.push({
          name: state.stateName,
          demand: state.demand,
          unit: state.unit
        });
      }

      return {
        timestamp: `${finalDateStr} ${finalTimeStr}`,
        regions: Object.values(regionsMap)
      };
    } catch (error: unknown) {
      console.error('Error fetching state wise demand:', error);
      throw error;
    }
  }

  async exportDataAsCsvStream(dataset: string, startDate: string, endDate: string, res: Response) {
    try {
      const batchSize = 10000;
      let skip = 0;
      let hasMore = true;

      if (dataset === 'npp') {
        res.write('date,timeStr,demandMet\n');
      } else if (dataset === 'generation') {
        res.write('date,timeStr,thermal,gas,nuclear,hydro,wind,solar\n');
      } else if (dataset === 'state') {
        res.write('date,timeStr,stateName,region,demand,unit,price\n');
      } else if (dataset === 'weather') {
        res.write('date,maxTemp,minTemp,windSpeed,relativeHumidity,precipitationProb,precipitationSum,sunshineDuration,sunrise,sunset\n');
      }

      while (hasMore) {
        // Explicitly typed as an array containing any of your entity profiles
        let records: any[] = [];

        if (dataset === 'npp') {
          records = await prisma.nppRawDemandData.findMany({
            where: { date: { gte: startDate, lte: endDate } },
            orderBy: [{ date: 'asc' }, { timeStr: 'asc' }],
            skip,
            take: batchSize
          });

          for (const row of records) {
            res.write(`${row.date},${row.timeStr},${row.demandMet}\n`);
          }
        } else if (dataset === 'generation') {
          records = await prisma.nppRawGenerationData.findMany({
            where: { date: { gte: startDate, lte: endDate } },
            orderBy: [{ date: 'asc' }, { timeStr: 'asc' }],
            skip,
            take: batchSize
          });

          for (const row of records) {
            res.write(`${row.date},${row.timeStr},${row.thermal},${row.gas},${row.nuclear},${row.hydro},${row.wind},${row.solar}\n`);
          }
        } else if (dataset === 'state') {
          records = await prisma.stateDemandData.findMany({
            where: { date: { gte: startDate, lte: endDate } },
            orderBy: [{ date: 'asc' }, { timeStr: 'asc' }, { stateName: 'asc' }],
            skip,
            take: batchSize
          });

          for (const row of records) {
            res.write(`${row.date},${row.timeStr},"${row.stateName}","${row.region}",${row.demand},${row.unit},${row.price}\n`);
          }
        } else if (dataset === 'weather') {
          records = await prisma.weatherForecast.findMany({
            where: { date: { gte: startDate, lte: endDate } },
            orderBy: { date: 'asc' },
            skip,
            take: batchSize
          });

          for (const row of records) {
            res.write(`${row.date},${row.maxTemp},${row.minTemp},${row.windSpeed},${row.relativeHumidity},${row.precipitationProb},${row.precipitationSum},${row.sunshineDuration},${row.sunrise},${row.sunset}\n`);
          }
        } else {
          hasMore = false;
          break;
        }

        if (records.length < batchSize) {
          hasMore = false;
        } else {
          skip += batchSize;
        }
      }
    } catch (e: unknown) {
      console.error('Error in exportDataAsCsvStream:', e);
      throw e;
    }
  }
}