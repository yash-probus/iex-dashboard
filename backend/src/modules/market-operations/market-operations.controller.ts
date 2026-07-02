import { Request, Response } from 'express';
import { MarketOperationsService } from './market-operations.service';

const marketOpsService = new MarketOperationsService();

export class MarketOperationsController {
  async getRecords(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      
      const data = await marketOpsService.getRecords(startDate, endDate);
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error fetching market operations data:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch market operations data' });
    }
  }

  async uploadRecords(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const result = await marketOpsService.uploadRecords(req.file.path, req.file.originalname);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error uploading market operations:', error);
      res.status(error.statusCode || 500).json({ 
        success: false, 
        message: error.message || 'Failed to upload market operations' 
      });
    }
  }
}
