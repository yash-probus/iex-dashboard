const fs = require('fs');

const path = '/Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance/trader-performance.controller.ts';
let content = fs.readFileSync(path, 'utf8');

const newMethods = `
  static async calculateSavings(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const targetMonth = req.query.month as string | undefined;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

      const result = await TraderPerformanceService.calculateSavings(id, targetMonth, version);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async calculateMarketDecision(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const targetMonth = req.query.monthStr as string | undefined;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

      const result = await TraderPerformanceService.calculateMarketDecision(id, targetMonth, version);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const history = await TraderPerformanceService.getHistory(id);
      return res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getDemandShiftInsights(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const targetMonth = req.query.targetMonth as string | undefined;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

      const result = await TraderPerformanceService.calculateDemandShiftInsights(id, targetMonth, version);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async exportExcel(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const targetMonth = req.query.month as string | undefined;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
      
      const { TraderPerformanceExportService } = await import('./trader-performance.export');
      const buffer = await TraderPerformanceExportService.exportToExcel(id, targetMonth, version);
      
      const entry = await TraderPerformanceService.getEntryOrVersion(id, version);
      const safeName = (entry?.clientName || 'Client').replace(/[^a-zA-Z0-9_\\-]/g, '_');
      const filename = \`\${safeName}_Trader_Performance\${targetMonth ? \`_\${targetMonth}\` : ''}.xlsx\`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', \`attachment; filename="\${filename}"\`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async exportDemandShiftExcel(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const targetMonth = req.query.month as string | undefined;
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
      
      const { TraderPerformanceExportService } = await import('./trader-performance.export');
      const buffer = await TraderPerformanceExportService.exportDemandShiftToExcel(id, targetMonth, version);
      
      const entry = await TraderPerformanceService.getEntryOrVersion(id, version);
      const safeName = (entry?.clientName || 'Client').replace(/[^a-zA-Z0-9_\\-]/g, '_');
      const filename = \`\${safeName}_Demand_Shift\${targetMonth ? \`_\${targetMonth}\` : ''}.xlsx\`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', \`attachment; filename="\${filename}"\`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
`;

content = content.replace(/static async getClientOverview[\\s\\S]*?static async getResourceDefaults[\\s\\S]*?\\n}/, (match) => {
  return match.replace(/\\n}$/, newMethods + '\\n}');
});

fs.writeFileSync(path, content);
