import { Router } from 'express';
import { LandingPriceCalcController } from './landing-price-calc.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Secure all routes
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Landing Price Calculator
 *   description: Landing Price Calculator endpoints utilizing IEX APIs
 */

/**
 * @swagger
 * /api/landing-price-calc/calculate:
 *   get:
 *     summary: Run landing price calculation via IEX API
 *     tags: [Landing Price Calculator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: voltage
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: consumerCategory
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: todMonth
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: todSlot
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: iexPrice
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Landing price calculation result
 */
router.get('/calculate', LandingPriceCalcController.calculate);

export default router;
