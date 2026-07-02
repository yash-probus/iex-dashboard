import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import path from 'path';
import { AppError } from '../../utils/AppError';
import { logger } from '../../logger';

const prisma = new PrismaClient();

interface RawHolidayRow {
  Month?: string;
  month?: string;
  Holiday_date?: string;
  holiday_date?: string;
  Holiday_name?: string;
  holiday_name?: string;
  Holiday_type?: string;
  holiday_type?: string;
  State?: string;
  state?: string;
  [key: string]: any;
}

export class HolidayService {
  async getHolidays() {
    try {
      return await prisma.holidayCalendar.findMany({
        orderBy: {
          createdAt: 'asc'
        }
      });
    } catch (error) {
      logger.error('Error fetching holidays:', error);
      throw error;
    }
  }

  async uploadHolidays(filePath: string, originalFileName?: string) {
    try {
      const fileNameToValidate = originalFileName || filePath;
      const ext = path.extname(fileNameToValidate).toLowerCase();
      if (!['.xlsx', '.xls', '.csv', '.xlxs'].includes(ext)) {
        throw new AppError('Invalid file type. Only Excel (.xlsx, .xls) and CSV (.csv) are supported.', 400);
      }

      const workbook = xlsx.readFile(filePath);
      let sheetName = workbook.SheetNames[0];
      for (const name of workbook.SheetNames) {
        if (workbook.Sheets[name]['!ref']) {
          sheetName = name;
          break;
        }
      }

      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet || !worksheet['!ref']) {
        throw new AppError('The uploaded file is empty.', 400);
      }

      // Parse spreadsheet rows as JSON objects
      const rawRows = xlsx.utils.sheet_to_json<RawHolidayRow>(worksheet, { defval: '' });

      if (rawRows.length === 0) {
        throw new AppError('No data rows found in the uploaded file.', 400);
      }

      const holidaysToInsert: any[] = [];

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];

        // Resolve case-insensitive columns
        const monthVal = (row.Month || row.month || '').toString().trim();
        const dateVal = (row.Holiday_date || row.holiday_date || '').toString().trim();
        const nameVal = (row.Holiday_name || row.holiday_name || '').toString().trim();
        const typeVal = (row.Holiday_type || row.holiday_type || '').toString().trim();
        const stateVal = (row.State || row.state || '').toString().trim();

        // Skip rows that look like duplicates of header (e.g. Month = "Month") or are empty
        if (!monthVal && !dateVal && !nameVal) continue;
        if (monthVal.toLowerCase() === 'month' && dateVal.toLowerCase() === 'holiday_date') continue;

        // Validation
        if (!dateVal || !nameVal) {
          logger.warn(`Skipping invalid holiday row at index ${i}: Missing date or name`);
          continue;
        }

        holidaysToInsert.push({
          month: monthVal,
          holidayDate: dateVal,
          holidayName: nameVal,
          holidayType: typeVal || 'SH',
          state: stateVal || 'National'
        });
      }

      if (holidaysToInsert.length === 0) {
        throw new AppError('No valid holiday records could be parsed from the file.', 400);
      }

      // Execute in a transaction: clear old holidays and insert new ones
      await prisma.$transaction(async (tx) => {
        await tx.holidayCalendar.deleteMany({});
        await tx.holidayCalendar.createMany({
          data: holidaysToInsert
        });
      });

      logger.info(`Successfully uploaded and saved ${holidaysToInsert.length} holiday calendar records.`);
      return { success: true, count: holidaysToInsert.length };

    } catch (error) {
      logger.error('Error processing holiday upload:', error);
      throw error;
    }
  }
}
