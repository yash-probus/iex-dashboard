import { Router } from 'express';
import { ApiLogController } from './api-log.controller';

const router = Router();

router.get('/', ApiLogController.getLogs);

export default router;
