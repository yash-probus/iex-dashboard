import { Router } from 'express';
import { SavingsCalculatorController } from './savings-calculator.controller';

const router = Router();

router.get('/', SavingsCalculatorController.getAll);
router.get('/:id', SavingsCalculatorController.getById);
router.post('/', SavingsCalculatorController.create);
router.put('/:id', SavingsCalculatorController.update);
router.delete('/:id', SavingsCalculatorController.delete);
router.post('/:id/calculate', SavingsCalculatorController.calculate);

export default router;
