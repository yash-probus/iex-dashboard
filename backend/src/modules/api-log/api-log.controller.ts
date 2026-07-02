import { Request, Response } from 'express';
import { ApiLogService } from './api-log.service';

export class ApiLogController {
  static async getLogs(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const logs = await ApiLogService.getLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('[ApiLogController] Failed to fetch logs:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
