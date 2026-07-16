import { Router } from 'express';
import { SavingsCalculatorController } from './savings-calculator.controller';

const router = Router();

router.get('/', SavingsCalculatorController.getAll);
router.get('/:id', SavingsCalculatorController.getById);
router.post('/', SavingsCalculatorController.create);
router.put('/:id', SavingsCalculatorController.update);
router.delete('/:id', SavingsCalculatorController.delete);
router.post('/:id/calculate', SavingsCalculatorController.calculate);
router.post('/:id/calculate-market-decision', SavingsCalculatorController.calculateMarketDecision);
router.get('/:id/export-excel', SavingsCalculatorController.exportExcel);

export default router;
