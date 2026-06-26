import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { 
  getDamData, 
  getGdamData, 
  getRtmData, 
  getDamAnalytics, 
  getGdamAnalytics, 
  getRtmAnalytics,
  getOverviewData
} from './dashboard.controller';

export const dashboardRouter = Router();

// Notice: No authMiddleware here. Dashboard APIs are PUBLIC. (Deliverable 11)

dashboardRouter.get('/overview', asyncHandler(getOverviewData));

dashboardRouter.get('/dam', asyncHandler(getDamData));
dashboardRouter.get('/gdam', asyncHandler(getGdamData));
dashboardRouter.get('/rtm', asyncHandler(getRtmData));

dashboardRouter.get('/dam/analytics', asyncHandler(getDamAnalytics));
dashboardRouter.get('/gdam/analytics', asyncHandler(getGdamAnalytics));
dashboardRouter.get('/rtm/analytics', asyncHandler(getRtmAnalytics));
