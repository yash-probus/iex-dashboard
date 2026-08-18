import { Request, Response } from 'express';
import { SavingsCalculatorNewService } from './savings-calculator-new.service';

export class SavingsCalculatorNewController {
  static async getAll(req: Request, res: Response) {
    try {
      const entries = await SavingsCalculatorNewService.getAll();
      return res.status(200).json({
        success: true,
        data: entries
      });
    } catch (error: any) {
      console.error('[SavingsCalculatorNewController] Error in getAll:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch entries.'
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
      const entry = await SavingsCalculatorNewService.getEntryOrVersion(id, version);

      if (!entry) {
        return res.status(404).json({
          success: false,
          message: 'Entry not found.'
        });
      }

      return res.status(200).json({
        success: true,
        data: entry
      });
    } catch (error: any) {
      console.error('[SavingsCalculatorNewController] Error in getById:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch entry.'
      });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const {
        clientName, industryName, address, sanctionedLoadKw,
        stateCode, discom, consumerCategory, voltageLevel,
        proltMargin, traderMargin, meteringCharges, consultancyFee, probusPlatformFee,
        todConsumptions, applyElectricityDuty, billedDemandKv, powerFactor,
        arrearAmount, currentLpsc, billDate, createdBy, updatedBy
      } = req.body;

      if (!clientName || !industryName || !address) {
        return res.status(400).json({
          success: false,
          message: 'Client name, industry name, and address are required fields.'
        });
      }

      const entry = await SavingsCalculatorNewService.create({
        clientName, industryName, address,
        sanctionedLoadKw: sanctionedLoadKw ? Number(sanctionedLoadKw) : undefined,
        stateCode, discom, consumerCategory, voltageLevel,
        proltMargin: proltMargin !== undefined ? Number(proltMargin) : undefined,
        traderMargin: traderMargin !== undefined ? Number(traderMargin) : undefined,
        meteringCharges: meteringCharges !== undefined && meteringCharges !== null ? Number(meteringCharges) : null,
        consultancyFee: consultancyFee !== undefined ? Number(consultancyFee) : undefined,
        probusPlatformFee: probusPlatformFee !== undefined ? Number(probusPlatformFee) : undefined,
        todConsumptions,
        applyElectricityDuty,
        billedDemandKv: billedDemandKv !== undefined && billedDemandKv !== null ? Number(billedDemandKv) : null,
        powerFactor: powerFactor !== undefined && powerFactor !== null ? Number(powerFactor) : null,
        arrearAmount: arrearAmount !== undefined && arrearAmount !== null ? Number(arrearAmount) : null,
        currentLpsc: currentLpsc !== undefined && currentLpsc !== null ? Number(currentLpsc) : null,
        billDate, createdBy, updatedBy
      });

      return res.status(201).json({
        success: true,
        data: entry
      });
    } catch (error: any) {
      console.error('[SavingsCalculatorNewController] Error in create:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create entry.'
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const {
        clientName, industryName, address, sanctionedLoadKw,
        stateCode, discom, consumerCategory, voltageLevel,
        proltMargin, traderMargin, meteringCharges, consultancyFee, probusPlatformFee,
        todConsumptions, applyElectricityDuty, billedDemandKv, powerFactor,
        arrearAmount, currentLpsc, billDate, updatedBy
      } = req.body;

      const entry = await SavingsCalculatorNewService.update(id, {
        clientName, industryName, address,
        sanctionedLoadKw: sanctionedLoadKw ? Number(sanctionedLoadKw) : undefined,
        stateCode, discom, consumerCategory, voltageLevel,
        proltMargin: proltMargin !== undefined ? Number(proltMargin) : undefined,
        traderMargin: traderMargin !== undefined ? Number(traderMargin) : undefined,
        meteringCharges: meteringCharges !== undefined && meteringCharges !== null ? Number(meteringCharges) : null,
        consultancyFee: consultancyFee !== undefined ? Number(consultancyFee) : undefined,
        probusPlatformFee: probusPlatformFee !== undefined ? Number(probusPlatformFee) : undefined,
        todConsumptions,
        applyElectricityDuty,
        billedDemandKv: billedDemandKv !== undefined && billedDemandKv !== null ? Number(billedDemandKv) : null,
        powerFactor: powerFactor !== undefined && powerFactor !== null ? Number(powerFactor) : null,
        arrearAmount: arrearAmount !== undefined && arrearAmount !== null ? Number(arrearAmount) : null,
        currentLpsc: currentLpsc !== undefined && currentLpsc !== null ? Number(currentLpsc) : null,
        billDate, updatedBy
      });

      return res.status(200).json({
        success: true,
        data: entry
      });
    } catch (error: any) {
      console.error('[SavingsCalculatorNewController] Error in update:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update entry.'
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      await SavingsCalculatorNewService.delete(id);
      return res.status(200).json({
        success: true,
        message: 'Entry deleted successfully.'
      });
    } catch (error: any) {
      console.error('[SavingsCalculatorNewController] Error in delete:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete entry.'
      });
    }
  }

  static async calculateSavings(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const targetMonth = req.query.month as string | undefined;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

      const result = await SavingsCalculatorNewService.calculateSavings(id, targetMonth, version);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[SavingsCalculatorNewController] Error in calculateSavings:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate savings.'
      });
    }
  }

  static async calculateMarketDecision(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const targetMonth = req.query.month as string | undefined;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

      const result = await SavingsCalculatorNewService.calculateMarketDecision(id, targetMonth, version);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[SavingsCalculatorNewController] Error in calculateMarketDecision:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate market decision.'
      });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const history = await SavingsCalculatorNewService.getHistory(id);
      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (error: any) {
      console.error('[SavingsCalculatorNewController] Error in getHistory:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch history.'
      });
    }
  }

  static async getClientOverview(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const overview = await SavingsCalculatorNewService.getClientOverview(id);
      return res.status(200).json({
        success: true,
        data: overview
      });
    } catch (error: any) {
      console.error('[SavingsCalculatorNewController] Error in getClientOverview:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch client overview.'
      });
    }
  }
}
