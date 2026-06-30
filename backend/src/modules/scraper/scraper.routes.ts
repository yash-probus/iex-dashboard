import { Router } from 'express';
import { triggerScraper } from './scraper.controller';
import { asyncHandler } from '../../middleware/asyncHandler';
// Using existing requireAuth middleware to protect the endpoint
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// POST /api/scraper/sync
router.post('/sync', authMiddleware, asyncHandler(triggerScraper));

export default router;
