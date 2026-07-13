import { Request, Response } from 'express';
import { SavingsCalculatorService } from './savings-calculator.service';

export class SavingsCalculatorController {
  static async getAll(req: Request, res: Response) {
    try {
      const entries = await SavingsCalculatorService.getAll();
      res.json(entries);
    } catch (error) {
      console.error('[SavingsCalculatorController] Failed to get entries:', error);
      res.status(500).json({ message: 'Failed to retrieve entries.' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const entry = await SavingsCalculatorService.getById(id);
      if (!entry) {
        return res.status(404).json({ message: 'Entry not found.' });
      }
      res.json(entry);
    } catch (error) {
      console.error('[SavingsCalculatorController] Failed to get entry:', error);
      res.status(500).json({ message: 'Failed to retrieve entry.' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { 
        clientName, 
        industryName, 
        address,
        sanctionedLoadKw,
        stateCode,
        discom,
        consumerCategory,
        voltageLevel,
        todConsumptions
      } = req.body;

      if (!clientName || !industryName || !address) {
        return res.status(400).json({ message: 'Missing required fields: clientName, industryName, address.' });
      }

      const entry = await SavingsCalculatorService.create({ 
        clientName, 
        industryName, 
        address,
        sanctionedLoadKw: sanctionedLoadKw ? parseFloat(sanctionedLoadKw) : undefined,
        stateCode,
        discom,
        consumerCategory,
        voltageLevel,
        todConsumptions
      });

      res.status(201).json(entry);
    } catch (error) {
      console.error('[SavingsCalculatorController] Failed to create entry:', error);
      res.status(500).json({ message: 'Failed to create entry.' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { 
        clientName, 
        industryName, 
        address,
        sanctionedLoadKw,
        stateCode,
        discom,
        consumerCategory,
        voltageLevel,
        todConsumptions
      } = req.body;

      if (!clientName || !industryName || !address) {
        return res.status(400).json({ message: 'Missing required fields: clientName, industryName, address.' });
      }

      const entry = await SavingsCalculatorService.update(id, { 
        clientName, 
        industryName, 
        address,
        sanctionedLoadKw: sanctionedLoadKw ? parseFloat(sanctionedLoadKw) : undefined,
        stateCode,
        discom,
        consumerCategory,
        voltageLevel,
        todConsumptions
      });

      res.json(entry);
    } catch (error) {
      console.error('[SavingsCalculatorController] Failed to update entry:', error);
      res.status(500).json({ message: 'Failed to update entry.' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await SavingsCalculatorService.delete(id);
      res.json({ message: 'Entry deleted successfully.' });
    } catch (error) {
      console.error('[SavingsCalculatorController] Failed to delete entry:', error);
      res.status(500).json({ message: 'Failed to delete entry.' });
    }
  }

  static async calculate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const targetMonth = typeof req.query.month === 'string' ? req.query.month : undefined;
      const result = await SavingsCalculatorService.calculateSavings(id, targetMonth);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[SavingsCalculatorController] Calculation failed:', error);
      res.status(500).json({ message: error.message || 'Savings calculation failed.' });
    }
  }
}
