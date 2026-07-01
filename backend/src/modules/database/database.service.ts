import axios from 'axios';
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import { Response } from 'express';

const prisma = new PrismaClient();

export class DatabaseService {
  async getWeatherData() {
    try {
      const forecasts = await prisma.weatherForecast.findMany({
        orderBy: { date: 'asc' }
      });
      return forecasts;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  async getAllIndiaDemand(date?: string) {
    try {
      const targetDate = date || '2026-06-30';
      const data = await prisma.nppDemandData.findMany({
        where: { date: targetDate },
        orderBy: { timeStr: 'asc' }
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching All India Demand:', error);
      throw error;
    }
  }

  async getStateWiseDemand(dateStr?: string, timeStr?: string) {
    try {
      // If date/time not provided, find the most recent record's date and time
      if (!dateStr || !timeStr) {
        const latest = await prisma.stateDemandData.findFirst({
          orderBy: [
            { date: 'desc' },
            { timeStr: 'desc' }
          ]
        });
        
        if (latest) {
          dateStr = latest.date;
          timeStr = latest.timeStr;
        } else {
          // Fallback if DB is empty
          dateStr = new Date().toISOString().split('T')[0];
          timeStr = "00:00";
        }
      }

      const allStates = await prisma.stateDemandData.findMany({
        where: {
          date: dateStr,
          timeStr: timeStr
        }
      });
      
      // Group by region
      const regionsMap: Record<string, any> = {};
      
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
        timestamp: `${dateStr} ${timeStr}`,
        regions: Object.values(regionsMap)
      };
    } catch (error) {
      console.error('Error fetching state wise demand:', error);
      throw error;
    }
  }

  async exportDataAsCsvStream(dataset: string, startDate: string, endDate: string, res: Response) {
    try {
      const batchSize = 10000;
      let skip = 0;
      let hasMore = true;

      // Write headers
      if (dataset === 'npp') {
        res.write('date,timeStr,demandMet,hydro,wind,gas,solar,nuclear,thermal\n');
      } else if (dataset === 'state') {
        res.write('date,timeStr,stateName,region,demand,unit,price\n');
      } else if (dataset === 'weather') {
        res.write('date,maxTemp,minTemp,windSpeed,relativeHumidity,precipitationProb,precipitationSum,sunshineDuration\n');
      }

      while (hasMore) {
        let records: any[] = [];
        
        if (dataset === 'npp') {
          records = await prisma.nppDemandData.findMany({
            where: { date: { gte: startDate, lte: endDate } },
            orderBy: [{ date: 'asc' }, { timeStr: 'asc' }],
            skip,
            take: batchSize
          });
          
          for (const row of records) {
            res.write(`${row.date},${row.timeStr},${row.demandMet},${row.hydro},${row.wind},${row.gas},${row.solar},${row.nuclear},${row.thermal}\n`);
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
            res.write(`${row.date},${row.maxTemp},${row.minTemp},${row.windSpeed},${row.relativeHumidity},${row.precipitationProb},${row.precipitationSum},${row.sunshineDuration}\n`);
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
    } catch (e) {
      console.error('Error in exportDataAsCsvStream:', e);
      throw e;
    }
  }
}
