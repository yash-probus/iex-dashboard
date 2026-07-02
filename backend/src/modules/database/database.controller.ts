import { Request, Response } from 'express';
import { DatabaseService } from './database.service';
import { HolidayService } from './holiday.service';

const databaseService = new DatabaseService();
const holidayService = new HolidayService();

export class DatabaseController {
  async getDemandData(req: Request, res: Response) {
    try {
      const date = req.query.date as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const time = req.query.time as string;
      
      const [allIndiaDemand, stateWiseDemand] = await Promise.all([
        databaseService.getAllIndiaDemand(startDate || date, endDate || date),
        databaseService.getStateWiseDemand(date, time)
      ]);

      res.status(200).json({
        success: true,
        data: {
          allIndiaDemand,
          stateWiseDemand
        }
      });
    } catch (error) {
      console.error('Error fetching demand data:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch demand data' });
    }
  }

  async getGenerationData(req: Request, res: Response) {
    try {
      const date = req.query.date as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      const generationData = await databaseService.getGenerationData(startDate || date, endDate || date);

      res.status(200).json({
        success: true,
        data: generationData
      });
    } catch (error) {
      console.error('Error fetching generation data:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch generation data' });
    }
  }

  async getWeatherData(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const weatherData = await databaseService.getWeatherData(startDate, endDate);
      res.status(200).json({
        success: true,
        data: weatherData
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch weather data' });
    }
  }

  async exportCSV(req: Request, res: Response) {
    try {
      const { dataset, startDate, endDate } = req.query as { dataset: string, startDate: string, endDate: string };
      
      if (!dataset || !startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Missing dataset, startDate, or endDate' });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${dataset}_export_${startDate}_to_${endDate}.csv"`);

      await databaseService.exportDataAsCsvStream(dataset, startDate, endDate, res);
      
      res.end();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to export data' });
      } else {
        res.end();
      }
    }
  }

  async getHolidays(req: Request, res: Response) {
    try {
      const holidays = await holidayService.getHolidays();
      res.status(200).json({ success: true, data: holidays });
    } catch (error) {
      console.error('Error fetching holidays:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch holiday calendar' });
    }
  }

  async uploadHolidays(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const result = await holidayService.uploadHolidays(req.file.path);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error uploading holidays:', error);
      res.status(error.statusCode || 500).json({ 
        success: false, 
        message: error.message || 'Failed to upload holiday calendar' 
      });
    }
  }
}
