import { Router } from 'express';
import { SavingsCalculatorNewController } from './savings-calculator-new.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// CRUD Endpoints
router.get('/entries', SavingsCalculatorNewController.getAll);
router.get('/entries/resource-defaults', SavingsCalculatorNewController.getResourceDefaults);
router.post('/entries', SavingsCalculatorNewController.create);
router.get('/entries/:id', SavingsCalculatorNewController.getById);
router.put('/entries/:id', SavingsCalculatorNewController.update);
router.delete('/entries/:id', SavingsCalculatorNewController.delete);

// History & Overview Endpoints
router.get('/entries/:id/history', SavingsCalculatorNewController.getHistory);
router.get('/entries/:id/client-overview', SavingsCalculatorNewController.getClientOverview);

// Calculation & Export Endpoints
router.get('/entries/:id/calculate', SavingsCalculatorNewController.calculateSavings);
router.get('/entries/:id/market-decision', SavingsCalculatorNewController.calculateMarketDecision);
router.get('/entries/:id/export-excel', SavingsCalculatorNewController.exportExcel);
router.get('/entries/:id/demand-shift-insights/export-excel', SavingsCalculatorNewController.exportDemandShiftExcel);

export default router;
