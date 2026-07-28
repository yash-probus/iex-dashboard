import { Router } from 'express';
import { SavingsCalculatorController } from './savings-calculator.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', SavingsCalculatorController.getAll);
router.get('/:id', SavingsCalculatorController.getById);
router.get('/:id/overview', SavingsCalculatorController.getClientOverview);
router.get('/:id/history', SavingsCalculatorController.getHistory);
router.post('/', SavingsCalculatorController.create);
router.put('/:id', SavingsCalculatorController.update);
router.delete('/:id', SavingsCalculatorController.delete);
router.post('/:id/calculate', SavingsCalculatorController.calculate);
router.post('/:id/calculate-market-decision', SavingsCalculatorController.calculateMarketDecision);
router.post('/:id/demand-shift-insights', SavingsCalculatorController.getDemandShiftInsights);
router.get('/:id/demand-shift-insights/export-excel', SavingsCalculatorController.exportDemandShiftExcel);
router.get('/:id/export-excel', SavingsCalculatorController.exportExcel);

export default router;
