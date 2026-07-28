import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, getAuditLogs } from './users.controller';
import { validateCreateUser, validateUpdateUser } from './users.validation';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { superAdminMiddleware } from '../../middleware/super-admin.middleware';

const router = Router();

// Protect all routes with auth AND super-admin middleware
router.use(authMiddleware);
router.use(superAdminMiddleware);

router.get('/', asyncHandler(getUsers));
router.get('/audit-logs', asyncHandler(getAuditLogs));
router.post('/', validateCreateUser, asyncHandler(createUser));
router.put('/:id', validateUpdateUser, asyncHandler(updateUser));
router.delete('/:id', asyncHandler(deleteUser));

export default router;
