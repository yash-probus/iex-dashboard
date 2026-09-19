import { PrismaClient } from '@prisma/client';
import { logger } from '../../logger';

const prisma = new PrismaClient();

export class UpMarketService {
  async getMarketData(market: 'DAM' | 'RTM', startDate: string, endDate: string) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Fetch from respective table based on market
      let records: any[] = [];
      if (market === 'DAM') {
        records = await prisma.exchangeDamRate.findMany({
          where: {
            date: {
              gte: start,
              lte: end
            },
            state: 'UP'
          },
          orderBy: [
            { date: 'asc' },
            { intervalTime: 'asc' }
          ]
        });
      } else if (market === 'RTM') {
        records = await prisma.exchangeRtmRate.findMany({
          where: {
            date: {
              gte: start,
              lte: end
            },
            state: 'UP'
          },
          orderBy: [
            { date: 'asc' },
            { intervalTime: 'asc' }
          ]
        });
      }

      if (!records || records.length === 0) {
        return { intervals: [], analytics: this.getEmptyAnalytics() };
      }

      // Format intervals
      const intervals = records.map(r => {
        // extract time string from datetime field (intervalTime)
        const timeStr = r.intervalTime instanceof Date 
            ? r.intervalTime.toISOString().substring(11, 16)
            : r.intervalTime;

        return {
          id: r.id.toString(),
          date: r.date.toISOString(),
          timeblock: timeStr,
          mcp: r.mcp ? Number(r.mcp) : 0,
          mcv: r.mcv ? Number(r.mcv) : 0,
          purchaseBid: r.purchaseBid ? Number(r.purchaseBid) : 0,
          sellBid: r.sellBid ? Number(r.sellBid) : 0,
        };
      });

      // Calculate analytics
      let totalMcp = 0;
      let maxMcp = -Infinity;
      let minMcp = Infinity;
      let maxMcv = -Infinity;

      intervals.forEach(inv => {
        totalMcp += inv.mcp;
        if (inv.mcp > maxMcp) maxMcp = inv.mcp;
        if (inv.mcp < minMcp) minMcp = inv.mcp;
        if (inv.mcv > maxMcv) maxMcv = inv.mcv;
      });

      const averageMcp = totalMcp / intervals.length;

      return {
        intervals,
        analytics: {
          averageMcp: Number(averageMcp.toFixed(2)),
          maxMcp: maxMcp === -Infinity ? 0 : maxMcp,
          minMcp: minMcp === Infinity ? 0 : minMcp,
          maxMcv: maxMcv === -Infinity ? 0 : maxMcv,
        }
      };

    } catch (error) {
      logger.error(`Error fetching UP Market data for ${market}:`, error);
      throw error;
    }
  }

  private getEmptyAnalytics() {
    return {
      averageMcp: 0,
      totalVolume: 0,
      maxMcv: 0,
      maxFsv: 0,
      maxMcp: 0,
      minMcp: 0
    };
  }
}
