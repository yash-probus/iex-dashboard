import { Router } from 'express';
import { CustomSavingCalcController } from './custom-saving-calc.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// CRUD Endpoints
router.get('/entries', CustomSavingCalcController.getAll);
router.get('/entries/resource-defaults', CustomSavingCalcController.getResourceDefaults);
router.post('/entries', CustomSavingCalcController.create);
router.get('/entries/:id', CustomSavingCalcController.getById);
router.put('/entries/:id', CustomSavingCalcController.update);
router.delete('/entries/:id', CustomSavingCalcController.delete);

// History & Overview Endpoints
router.get('/entries/:id/history', CustomSavingCalcController.getHistory);
router.get('/entries/:id/client-overview', CustomSavingCalcController.getClientOverview);

// Calculation & Export Endpoints
router.get('/entries/:id/calculate', CustomSavingCalcController.calculateSavings);
router.get('/entries/:id/market-decision', CustomSavingCalcController.calculateMarketDecision);

// Demand Shift
router.post('/entries/:id/demand-shift-insights', CustomSavingCalcController.getDemandShiftInsights);

// Exports
router.get('/entries/:id/export-excel', CustomSavingCalcController.exportExcel);
router.get('/entries/:id/demand-shift-insights/export-excel', CustomSavingCalcController.exportDemandShiftExcel);

export default router;
