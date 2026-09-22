import { Router } from 'express';
import { SavingsCalculatorController } from './savings-calculator.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Savings Calculator
 *   description: Savings Calculator endpoints
 */

/**
 * @swagger
 * /api/savings-calculator:
 *   get:
 *     summary: Get all calculations
 *     tags: [Savings Calculator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of calculations
 */
router.get('/', SavingsCalculatorController.getAll);

/**
 * @swagger
 * /api/savings-calculator/{id}:
 *   get:
 *     summary: Get calculation by ID
 *     tags: [Savings Calculator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Calculation details
 */
router.get('/:id', SavingsCalculatorController.getById);

/**
 * @swagger
 * /api/savings-calculator/{id}/overview:
 *   get:
 *     summary: Get client overview
 *     tags: [Savings Calculator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Overview details
 */
router.get('/:id/overview', SavingsCalculatorController.getClientOverview);

/**
 * @swagger
 * /api/savings-calculator/{id}/history:
 *   get:
 *     summary: Get calculation history
 *     tags: [Savings Calculator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: History details
 */
router.get('/:id/history', SavingsCalculatorController.getHistory);

/**
 * @swagger
 * /api/savings-calculator:
 *   post:
 *     summary: Create new calculation
 *     tags: [Savings Calculator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId: { type: string }
 *     responses:
 *       200:
 *         description: Created calculation
 */
router.post('/', SavingsCalculatorController.create);

/**
 * @swagger
 * /api/savings-calculator/{id}:
 *   put:
 *     summary: Update calculation
 *     tags: [Savings Calculator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated calculation
 */
router.put('/:id', SavingsCalculatorController.update);

/**
 * @swagger
 * /api/savings-calculator/{id}:
 *   delete:
 *     summary: Delete calculation
 *     tags: [Savings Calculator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
router.delete('/:id', SavingsCalculatorController.delete);

/**
 * @swagger
 * /api/savings-calculator/{id}/calculate:
 *   post:
 *     summary: Run calculation
 *     tags: [Savings Calculator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Calculation result
 */
router.post('/:id/calculate', SavingsCalculatorController.calculate);

/**
 * @swagger
 * /api/savings-calculator/{id}/calculate-market-decision:
 *   post:
 *     summary: Calculate market decision
 *     tags: [Savings Calculator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Market decision result
 */
router.post('/:id/calculate-market-decision', SavingsCalculatorController.calculateMarketDecision);

/**
 * @swagger
 * /api/savings-calculator/{id}/demand-shift-insights:
 *   post:
 *     summary: Get demand shift insights
 *     tags: [Savings Calculator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Insights result
 */
router.post('/:id/demand-shift-insights', SavingsCalculatorController.getDemandShiftInsights);

/**
 * @swagger
 * /api/savings-calculator/{id}/demand-shift-insights/export-excel:
 *   get:
 *     summary: Export demand shift to Excel
 *     tags: [Savings Calculator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Excel file buffer
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/demand-shift-insights/export-excel', SavingsCalculatorController.exportDemandShiftExcel);

/**
 * @swagger
 * /api/savings-calculator/{id}/export-excel:
 *   get:
 *     summary: Export full calculation to Excel
 *     tags: [Savings Calculator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Excel file buffer
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/export-excel', SavingsCalculatorController.exportExcel);

export default router;
