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
        proltMargin,
        traderMargin,
        todConsumptions,
        applyElectricityDuty
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
        proltMargin: proltMargin ? parseFloat(proltMargin) : undefined,
        traderMargin: traderMargin ? parseFloat(traderMargin) : undefined,
        todConsumptions,
        applyElectricityDuty: applyElectricityDuty !== undefined ? applyElectricityDuty : true
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
        proltMargin,
        traderMargin,
        todConsumptions,
        applyElectricityDuty
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
        proltMargin: proltMargin ? parseFloat(proltMargin) : undefined,
        traderMargin: traderMargin ? parseFloat(traderMargin) : undefined,
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
      const targetMonth = req.query.month;
      const result = await SavingsCalculatorService.calculateSavings(id as string, targetMonth as string | undefined);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[SavingsCalculatorController] Calculation failed:', error);
      res.status(500).json({ message: error.message || 'Savings calculation failed.' });
    }
  }

  static async calculateMarketDecision(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const targetMonth = req.query.month;
      const result = await SavingsCalculatorService.calculateMarketDecision(id as string, targetMonth as string | undefined);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[SavingsCalculatorController] Market Decision Calculation failed:', error);
      res.status(500).json({ message: error.message || 'Market decision calculation failed.' });
    }
  }
  static async exportExcel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const targetMonth = req.query.month;
      
      const { SavingsCalculatorExportService } = await import('./savings-calculator.export');
      const buffer = await SavingsCalculatorExportService.exportToExcel(id as string, targetMonth as string | undefined);
      
      // Get client name for filename
      const entry = await SavingsCalculatorService.getById(id as string);
      const clientName = entry?.clientName || id;
      const sanitizedClientName = String(clientName).replace(/[^a-zA-Z0-9_-]/g, '_');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Savings_Analysis_${sanitizedClientName}.xlsx`);
      res.status(200).send(buffer);
    } catch (error: any) {
      console.error('[SavingsCalculatorController] Excel Export failed:', error);
      res.status(500).json({ message: error.message || 'Excel export failed.' });
    }
  }
}
