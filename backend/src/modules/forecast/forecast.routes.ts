import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { ForecastController } from './forecast.controller';

const router = Router();

router.get('/price', asyncHandler(ForecastController.getPriceForecast));
router.get('/demand', asyncHandler(ForecastController.getDemandForecast));
router.get('/generation', asyncHandler(ForecastController.getGenerationForecast));
router.get('/dates', asyncHandler(ForecastController.getForecastDates));
router.get('/market-selection', asyncHandler(ForecastController.getMarketSelectionForecast));

export default router;
