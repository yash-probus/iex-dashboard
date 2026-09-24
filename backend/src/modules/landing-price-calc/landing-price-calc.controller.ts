import { Request, Response } from 'express';
import { LandingPriceCalcService } from './landing-price-calc.service';

export class LandingPriceCalcController {
  /**
   * Calculate landing price using IEX API
   */
  static async calculate(req: Request, res: Response) {
    try {
      // Inputs will typically come from query strings as per the IEX API format
      const query = req.query;
      
      const result = await LandingPriceCalcService.calculate(query);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[LandingPriceCalcController] Calculation failed:', error);
      res.status(500).json({ message: error.message || 'Landing price calculation failed.' });
    }
  }

  static async getConsumerCategories(req: Request, res: Response) {
    try {
      const result = await LandingPriceCalcService.getConsumerCategories(req.query.state as string);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getVoltages(req: Request, res: Response) {
    try {
      const result = await LandingPriceCalcService.getVoltages(req.query.state as string, req.query.consumerCategory as string);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getTodMonths(req: Request, res: Response) {
    try {
      const result = await LandingPriceCalcService.getTodMonths(req.query.state as string, req.query.consumerCategory as string, req.query.voltage as string);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getTodSlots(req: Request, res: Response) {
    try {
      const result = await LandingPriceCalcService.getTodSlots(req.query.state as string, req.query.consumerCategory as string, req.query.voltage as string, req.query.month as string);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
