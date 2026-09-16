import { Router } from 'express';
import { TraderPerformanceActualController, uploadTradeReports } from './trader-performance-actual.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = path.join(__dirname, '../../../uploads/trader-performance-actual');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// PDF upload route
router.post('/upload', upload.array('files', 200), uploadTradeReports);

// CRUD routes
router.get('/', TraderPerformanceActualController.getAll);
router.post('/', TraderPerformanceActualController.create);
router.get('/resource-defaults', TraderPerformanceActualController.getResourceDefaults);
router.get('/:id', TraderPerformanceActualController.getById);
router.put('/:id', TraderPerformanceActualController.update);
router.delete('/:id', TraderPerformanceActualController.delete);
router.get('/:id/client-overview', TraderPerformanceActualController.getClientOverview);
router.get('/:id/history', TraderPerformanceActualController.getHistory);
router.get('/:id/compare', TraderPerformanceActualController.compareSavings);
router.get('/:id/calculate', TraderPerformanceActualController.calculateSavings);
router.get('/:id/market-decision', TraderPerformanceActualController.calculateMarketDecision);
router.get('/:id/demand-shift-insights', TraderPerformanceActualController.getDemandShiftInsights);
router.get('/:id/export-excel', TraderPerformanceActualController.exportExcel);
router.get('/:id/actual-trader/export-excel', TraderPerformanceActualController.exportActualTraderExcel);
router.get('/:id/demand-shift-insights/export-excel', TraderPerformanceActualController.exportDemandShiftExcel);

export default router;
