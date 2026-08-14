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

  static async getHistory(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const history = await SavingsCalculatorService.getHistory(id);
      res.json(history);
    } catch (error) {
      console.error('[SavingsCalculatorController] Failed to get entry history:', error);
      res.status(500).json({ message: 'Failed to retrieve entry history.' });
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
        meteringCharges,
        consultancyFee,
        probusPlatformFee,
        todConsumptions,
        applyElectricityDuty,
        billedDemandKv,
        powerFactor,
        arrearAmount,
        currentLpsc,
        billDate
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
        meteringCharges: meteringCharges !== undefined && meteringCharges !== null && meteringCharges !== '' ? parseFloat(meteringCharges) : undefined,
        consultancyFee: consultancyFee ? parseFloat(consultancyFee) : undefined,
        probusPlatformFee: probusPlatformFee ? parseFloat(probusPlatformFee) : undefined,
        todConsumptions,
        applyElectricityDuty: applyElectricityDuty !== undefined ? applyElectricityDuty : true,
        billedDemandKv: billedDemandKv ? parseFloat(billedDemandKv) : undefined,
        powerFactor: powerFactor ? parseFloat(powerFactor) : undefined,
        arrearAmount: arrearAmount ? parseFloat(arrearAmount) : undefined,
        currentLpsc: currentLpsc ? parseFloat(currentLpsc) : undefined,
        billDate,
        createdBy: req.user?.username,
        updatedBy: req.user?.username
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
        meteringCharges,
        consultancyFee,
        probusPlatformFee,
        todConsumptions,
        applyElectricityDuty,
        billedDemandKv,
        powerFactor,
        arrearAmount,
        currentLpsc,
        billDate
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
        meteringCharges: meteringCharges !== undefined ? (meteringCharges === null || meteringCharges === '' ? null : parseFloat(meteringCharges)) : undefined,
        consultancyFee: consultancyFee ? parseFloat(consultancyFee) : undefined,
        probusPlatformFee: probusPlatformFee ? parseFloat(probusPlatformFee) : undefined,
        todConsumptions,
        applyElectricityDuty: applyElectricityDuty !== undefined ? applyElectricityDuty : undefined,
        billedDemandKv: billedDemandKv !== undefined ? (billedDemandKv ? parseFloat(billedDemandKv) : null) : undefined,
        powerFactor: powerFactor !== undefined ? (powerFactor ? parseFloat(powerFactor) : null) : undefined,
        arrearAmount: arrearAmount !== undefined ? (arrearAmount ? parseFloat(arrearAmount) : null) : undefined,
        currentLpsc: currentLpsc !== undefined ? (currentLpsc ? parseFloat(currentLpsc) : null) : undefined,
        billDate: billDate !== undefined ? (billDate ? billDate : null) : undefined,
        updatedBy: req.user?.username
      });

      res.json(entry);
    } catch (error) {
      console.error('[SavingsCalculatorController] Failed to update entry:', error);
      res.status(500).json({ message: 'Failed to update entry.' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
        const isNoDelete = req.user?.readOnlyModules?.includes('savings-calculator-nodelete');
        if (isNoDelete) {
          return res.status(403).json({ message: 'You do not have permission to delete entries.' });
        }
      }
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
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
      const result = await SavingsCalculatorService.calculateSavings(id as string, targetMonth as string | undefined, version);
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
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
      const result = await SavingsCalculatorService.calculateMarketDecision(id as string, targetMonth as string | undefined, version);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[SavingsCalculatorController] Market Decision Calculation failed:', error);
      res.status(500).json({ message: error.message || 'Market decision calculation failed.' });
    }
  }

  static async getClientOverview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await SavingsCalculatorService.getClientOverview(id as string);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[SavingsCalculatorController] Get Client Overview failed:', error);
      res.status(500).json({ message: error.message || 'Failed to get client overview.' });
    }
  }
  static async exportExcel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const targetMonth = req.query.month;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
      
      const { SavingsCalculatorExportService } = await import('./savings-calculator.export');
      const buffer = await SavingsCalculatorExportService.exportToExcel(id as string, targetMonth as string | undefined, version);
      
      // Get client name for filename
      const entry = await SavingsCalculatorService.getById(id as string);
      const clientName = entry?.clientName || id;
      const sanitizedClientName = String(clientName).replace(/[^a-zA-Z0-9_-]/g, '_');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Savings_Analysis_${sanitizedClientName}.xlsx`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.status(200).send(buffer);
    } catch (error: any) {
      console.error('[SavingsCalculatorController] Excel Export failed:', error);
      res.status(500).json({ message: error.message || 'Excel export failed.' });
    }
  }

  static async exportDemandShiftExcel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const targetMonth = req.query.month;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
      
      const { SavingsCalculatorExportService } = await import('./savings-calculator.export');
      const buffer = await SavingsCalculatorExportService.exportDemandShiftToExcel(id as string, targetMonth as string | undefined, version);
      
      const entry = await SavingsCalculatorService.getById(id as string);
      const clientName = entry?.clientName || id;
      const sanitizedClientName = String(clientName).replace(/[^a-zA-Z0-9_-]/g, '_');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Demand_Shift_Insights_${sanitizedClientName}.xlsx`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.status(200).send(buffer);
    } catch (error: any) {
      console.error('[SavingsCalculatorController] Demand Shift Excel Export failed:', error);
      res.status(500).json({ message: error.message || 'Demand Shift Excel export failed.' });
    }
  }

  static async getDemandShiftInsights(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const targetMonth = req.query.month;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
      const result = await SavingsCalculatorService.calculateDemandShiftInsights(id as string, targetMonth as string | undefined, version);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[SavingsCalculatorController] Demand Shift Insights failed:', error);
      res.status(500).json({ message: error.message || 'Demand shift insights failed.' });
    }
  }
}
