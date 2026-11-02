import { Router } from 'express';
import { UpsldcMeaController } from './upsldc-mea.controller';

const router = Router();

// 1. Data queries
router.get('/generators', UpsldcMeaController.getGenerators);
router.get('/summary', UpsldcMeaController.getSummary);
router.get('/generator/:genId', UpsldcMeaController.getGeneratorById);

// 2. Scraper operations
router.post('/scrape', UpsldcMeaController.triggerScrape);
router.get('/scrape/status', UpsldcMeaController.getScrapeStatus);
router.post('/sync-generators', UpsldcMeaController.syncGenerators);

// 3. Export Excel
router.get('/export-excel', UpsldcMeaController.exportExcel);

export default router;

