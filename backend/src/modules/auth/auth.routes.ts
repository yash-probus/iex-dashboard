import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, getMe } from './auth.controller';
import { validateLoginDTO } from './auth.validation';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Strict rate limiter for login to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per `window` (here, per 15 minutes)
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.post('/login', loginLimiter, validateLoginDTO, asyncHandler(login));
router.get('/me', authMiddleware, asyncHandler(getMe));

export default router;
