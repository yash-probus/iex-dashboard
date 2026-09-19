import { Router } from 'express';
import { UpMarketController } from './up-market.controller';

const router = Router();
const upMarketController = new UpMarketController();

router.get('/:market', upMarketController.getMarketData);

export default router;
