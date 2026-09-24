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
}
