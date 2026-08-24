import { Request, Response } from 'express';
import { CustomSavingCalcService } from './custom-saving-calc.service';

export class CustomSavingCalcController {
  static async getAll(req: Request, res: Response) {
    try {
      const entries = await CustomSavingCalcService.getAll();
      return res.status(200).json({
        success: true,
        data: entries
      });
    } catch (error: any) {
      console.error('[CustomSavingCalcController] Error in getAll:', error);
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
      const entry = await CustomSavingCalcService.getEntryOrVersion(id, version);

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
      console.error('[CustomSavingCalcController] Error in getById:', error);
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
        arrearAmount, currentLpsc, billDate
      } = req.body;

      if (!clientName || !industryName || !address) {
        return res.status(400).json({
          success: false,
          message: 'Client name, industry name, and address are required fields.'
        });
      }

      const entry = await CustomSavingCalcService.create({
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
        billDate, 
        createdBy: req.user?.username, 
        updatedBy: req.user?.username
      });

      return res.status(201).json({
        success: true,
        data: entry
      });
    } catch (error: any) {
      console.error('[CustomSavingCalcController] Error in create:', error);
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
        arrearAmount, currentLpsc, billDate
      } = req.body;

      const entry = await CustomSavingCalcService.update(id, {
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
        billDate, 
        updatedBy: req.user?.username
      });

      return res.status(200).json({
        success: true,
        data: entry
      });
    } catch (error: any) {
      console.error('[CustomSavingCalcController] Error in update:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update entry.'
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      await CustomSavingCalcService.delete(id);
      return res.status(200).json({
        success: true,
        message: 'Entry deleted successfully.'
      });
    } catch (error: any) {
      console.error('[CustomSavingCalcController] Error in delete:', error);
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

      const result = await CustomSavingCalcService.calculateSavings(id, targetMonth, version);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[CustomSavingCalcController] Error in calculateSavings:', error);
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

      const result = await CustomSavingCalcService.calculateMarketDecision(id, targetMonth, version);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[CustomSavingCalcController] Error in calculateMarketDecision:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate market decision.'
      });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const history = await CustomSavingCalcService.getHistory(id);
      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (error: any) {
      console.error('[CustomSavingCalcController] Error in getHistory:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch history.'
      });
    }
  }

  static async getClientOverview(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const overview = await CustomSavingCalcService.getClientOverview(id);
      return res.status(200).json({
        success: true,
        data: overview
      });
    } catch (error: any) {
      console.error('[CustomSavingCalcController] Error in getClientOverview:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch client overview.'
      });
    }
  }

  static async getDemandShiftInsights(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { targetMonth, version } = req.query;
      
      const result = await CustomSavingCalcService.calculateDemandShiftInsights(
        id as string, 
        targetMonth as string | undefined, 
        version ? Number(version) : undefined
      );

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[CustomSavingCalcController] Error in getDemandShiftInsights:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate demand shift insights'
      });
    }
  }

  static async exportExcel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const targetMonth = req.query.month as string | undefined;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
      
      const { CustomSavingCalcExportService } = await import('./custom-saving-calc.export');
      const buffer = await CustomSavingCalcExportService.exportToExcel(id as string, targetMonth as string | undefined, version);
      
      const entry = await CustomSavingCalcService.getEntryOrVersion(id as string, version);
      const safeName = (entry?.clientName || 'Client').replace(/[^a-zA-Z0-9_\-]/g, '_');
      const filename = `${safeName}_Savings_Analysis${targetMonth ? `_${targetMonth}` : ''}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(buffer);
    } catch (error: any) {
      console.error('Error exporting new savings excel:', error);
      res.status(500).json({ message: error.message || 'Excel export failed.' });
    }
  }

  static async exportDemandShiftExcel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const targetMonth = req.query.month as string | undefined;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
      
      const { CustomSavingCalcExportService } = await import('./custom-saving-calc.export');
      const buffer = await CustomSavingCalcExportService.exportDemandShiftToExcel(id as string, targetMonth as string | undefined, version);
      
      const entry = await CustomSavingCalcService.getEntryOrVersion(id as string, version);
      const safeName = (entry?.clientName || 'Client').replace(/[^a-zA-Z0-9_\-]/g, '_');
      const filename = `${safeName}_Demand_Shift_Analysis${targetMonth ? `_${targetMonth}` : ''}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(buffer);
    } catch (error: any) {
      console.error('Error exporting new demand shift excel:', error);
      res.status(500).json({ message: error.message || 'Demand shift excel export failed.' });
    }
  }

  static async getResourceDefaults(req: Request, res: Response) {
    try {
      const { stateCode, discom, consumerCategory, voltageLevel, monthStr } = req.query;
      const defaults = await CustomSavingCalcService.getResourceDefaults({
        stateCode: stateCode ? String(stateCode) : undefined,
        discom: discom ? String(discom) : undefined,
        consumerCategory: consumerCategory ? String(consumerCategory) : undefined,
        voltageLevel: voltageLevel ? String(voltageLevel) : undefined,
        monthStr: monthStr ? String(monthStr) : undefined,
      });
      return res.status(200).json({
        success: true,
        data: defaults
      });
    } catch (error: any) {
      console.error('[CustomSavingCalcController] Error in getResourceDefaults:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch resource defaults.'
      });
    }
  }
}
