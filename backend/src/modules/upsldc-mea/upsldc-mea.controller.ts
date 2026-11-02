import { Request, Response } from 'express';
import { UpsldcMeaService } from './upsldc-mea.service';
import { UpsldcMeaExportService } from './upsldc-mea.export';

export class UpsldcMeaController {
  /**
   * GET /api/upsldc-mea/generators
   * Filterable, searchable, and paginated list of generators
   */
  public static async getGenerators(req: Request, res: Response): Promise<void> {
    try {
      const {
        search,
        status,
        year,
        month,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = UpsldcMeaService.getGenerators({
        search: search ? String(search) : undefined,
        status: status ? (String(status) as any) : undefined,
        year: year ? String(year) : undefined,
        month: month ? String(month) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 50,
        sortBy: sortBy ? String(sortBy) : undefined,
        sortOrder: sortOrder ? (String(sortOrder) as any) : undefined
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[UpsldcMeaController] Error getting generators:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve UPSLDC OA generators'
      });
    }
  }

  /**
   * GET /api/upsldc-mea/summary
   * High-level metrics for dashboard cards relative to selected year and month
   */
  public static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { year, month } = req.query;
      const summary = UpsldcMeaService.getSummary({
        year: year ? String(year) : undefined,
        month: month ? String(month) : undefined
      });
      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      console.error('[UpsldcMeaController] Error getting summary:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve UPSLDC summary'
      });
    }
  }

  /**
   * GET /api/upsldc-mea/generator/:genId
   * Detailed single generator with complete MEA records
   */
  public static async getGeneratorById(req: Request, res: Response): Promise<void> {
    try {
      const genId = String(req.params.genId);
      const generator = UpsldcMeaService.getGeneratorById(genId);
      if (!generator) {
        res.status(404).json({
          success: false,
          message: `Generator with ID ${genId} not found`
        });
        return;
      }

      res.json({
        success: true,
        data: generator
      });
    } catch (error: any) {
      console.error('[UpsldcMeaController] Error getting generator:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve generator'
      });
    }
  }

  /**
   * POST /api/upsldc-mea/scrape
   * Triggers an on-demand live scrape
   */
  public static async triggerScrape(req: Request, res: Response): Promise<void> {
    try {
      const status = UpsldcMeaService.getScrapeStatus();
      if (status.isRunning) {
        res.status(409).json({
          success: false,
          message: 'A scrape job is already currently running',
          data: status
        });
        return;
      }

      // Fire and forget
      UpsldcMeaService.runScraper('MANUAL');

      res.json({
        success: true,
        message: 'UPSLDC Open Access MEA scraping initiated successfully',
        data: UpsldcMeaService.getScrapeStatus()
      });
    } catch (error: any) {
      console.error('[UpsldcMeaController] Error triggering scrape:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to trigger scraping'
      });
    }
  }

  /**
   * GET /api/upsldc-mea/scrape/status
   * Poll live scraping progress
   */
  public static async getScrapeStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = UpsldcMeaService.getScrapeStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      console.error('[UpsldcMeaController] Error getting scrape status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get scrape status'
      });
    }
  }

  /**
   * POST /api/upsldc-mea/sync-generators
   * Instantly query UPSLDC live portal to auto-discover newly added Open Access generators
   */
  public static async syncGenerators(req: Request, res: Response): Promise<void> {
    try {
      const result = await UpsldcMeaService.syncNewGenerators();
      res.json({
        success: true,
        data: result,
        message: result.newlyAdded > 0 
          ? `Discovered and registered ${result.newlyAdded} new generator(s) from UPSLDC portal!` 
          : 'Generator list is already up to date with UPSLDC portal.'
      });
    } catch (error: any) {
      console.error('[UpsldcMeaController] Error syncing generators:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to sync generators from UPSLDC'
      });
    }
  }

  /**
   * GET /api/upsldc-mea/export-excel
   * Downloads formatted Excel (.xlsx) file filtered by selected year and month
   */
  public static async exportExcel(req: Request, res: Response): Promise<void> {
    try {
      const { year, month } = req.query;
      const buffer = await UpsldcMeaExportService.generateExcelReport({
        year: year ? String(year) : undefined,
        month: month ? String(month) : undefined
      });
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `UPSLDC_OA_MEA_Non_Trading_Report_${year || 'Current'}_${month || 'Window'}_${dateStr}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('[UpsldcMeaController] Error exporting excel:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate Excel report'
      });
    }
  }
}
