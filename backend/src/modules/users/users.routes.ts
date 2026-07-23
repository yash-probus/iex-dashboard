import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from './users.controller';
import { validateCreateUser, validateUpdateUser } from './users.validation';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';

const router = Router();

// Protect all routes with auth AND admin middleware
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', asyncHandler(getUsers));
router.post('/', validateCreateUser, asyncHandler(createUser));
router.put('/:id', validateUpdateUser, asyncHandler(updateUser));
router.delete('/:id', asyncHandler(deleteUser));

export default router;
