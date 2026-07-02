import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import path from 'path';
import { AppError } from '../../utils/AppError';
import { logger } from '../../logger';

const prisma = new PrismaClient();

interface RawMarketOpRow {
  Date?: string | Date;
  date?: string | Date;
  Timeblock?: string | number;
  timeblock?: string | number;
  'DAM MCP'?: string | number;
  dam_mcp?: string | number;
  'RTM MCP'?: string | number;
  rtm_mcp?: string | number;
  'GDAM MCP'?: string | number;
  gdam_mcp?: string | number;
  [key: string]: any;
}

export class MarketOperationsService {
  async getRecords(startDate?: string, endDate?: string) {
    try {
      const where: any = {};
      
      if (startDate || endDate) {
        where.date = {};
        if (startDate) {
          where.date.gte = new Date(startDate);
        }
        if (endDate) {
          where.date.lte = new Date(endDate);
        }
      }

      return await prisma.marketOperation.findMany({
        where,
        orderBy: [
          { date: 'desc' },
          { timeblock: 'asc' }
        ],
        take: 1000 // Limit for performance, frontend can add pagination if needed later
      });
    } catch (error) {
      logger.error('Error fetching market operations:', error);
      throw error;
    }
  }

  async uploadRecords(filePath: string, originalFileName?: string) {
    try {
      const fileNameToValidate = originalFileName || filePath;
      const ext = path.extname(fileNameToValidate).toLowerCase();
      if (!['.xlsx', '.xls', '.csv', '.xlxs'].includes(ext)) {
        throw new AppError('Invalid file type. Only Excel (.xlsx, .xls) and CSV (.csv) are supported.', 400);
      }

      const workbook = xlsx.readFile(filePath, { cellDates: true });
      let sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet || !worksheet['!ref']) {
        throw new AppError('The uploaded file is empty.', 400);
      }

      const rawRows = xlsx.utils.sheet_to_json<RawMarketOpRow>(worksheet, { defval: '' });

      if (rawRows.length === 0) {
        throw new AppError('No data rows found in the uploaded file.', 400);
      }

      let upsertCount = 0;

      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];

          const dateVal = row.Date || row.date;
          const timeblockStr = row.Timeblock || row.timeblock;
          const damMcpStr = row['DAM MCP'] || row.dam_mcp;
          const rtmMcpStr = row['RTM MCP'] || row.rtm_mcp;
          const gdamMcpStr = row['GDAM MCP'] || row.gdam_mcp;

          // Skip empty rows
          if (!dateVal && !timeblockStr) continue;

          let parsedDate: Date;
          if (dateVal && dateVal instanceof Date) {
            parsedDate = dateVal;
          } else {
            // Assume format DD-MM-YYYY or YYYY-MM-DD
            const d = new Date(dateVal ? dateVal.toString() : '');
            if (isNaN(d.getTime())) {
              logger.warn(`Skipping row ${i} due to invalid date: ${dateVal}`);
              continue;
            }
            parsedDate = d;
          }

          const timeblock = parseInt(timeblockStr as string, 10);
          if (isNaN(timeblock)) {
             logger.warn(`Skipping row ${i} due to invalid timeblock: ${timeblockStr}`);
             continue;
          }

          const damMcp = parseFloat(damMcpStr as string) || 0;
          const rtmMcp = parseFloat(rtmMcpStr as string) || 0;
          const gdamMcp = parseFloat(gdamMcpStr as string) || 0;

          await tx.marketOperation.upsert({
            where: {
              date_timeblock: {
                date: parsedDate,
                timeblock: timeblock
              }
            },
            update: {
              damMcp,
              rtmMcp,
              gdamMcp
            },
            create: {
              date: parsedDate,
              timeblock,
              damMcp,
              rtmMcp,
              gdamMcp
            }
          });
          
          upsertCount++;
        }
      });

      logger.info(`Successfully uploaded and saved ${upsertCount} market operation records.`);
      return { success: true, count: upsertCount };

    } catch (error) {
      logger.error('Error processing market operations upload:', error);
      throw error;
    }
  }
}
