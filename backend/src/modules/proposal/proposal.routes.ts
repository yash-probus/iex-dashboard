import { Router } from 'express';
import { ProposalController } from './proposal.controller';

const router = Router();
const controller = new ProposalController();

/**
 * @swagger
 * tags:
 *   name: Proposal
 *   description: Proposal generation endpoints
 */

/**
 * @swagger
 * /api/proposal/generate:
 *   post:
 *     summary: Generate generic proposal
 *     tags: [Proposal]
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
 *         description: Generated proposal Word document
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/generate', controller.generate.bind(controller));

/**
 * @swagger
 * /api/proposal/generate-technical:
 *   post:
 *     summary: Generate technical proposal
 *     tags: [Proposal]
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
 *         description: Generated technical proposal Word document
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/generate-technical', controller.generateTechnical.bind(controller));

/**
 * @swagger
 * /api/proposal/generate-commercial:
 *   post:
 *     summary: Generate commercial proposal
 *     tags: [Proposal]
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
 *         description: Generated commercial proposal Word document
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/generate-commercial', controller.generateCommercial.bind(controller));

export default router;
