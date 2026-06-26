import { Router } from 'express';
import { 
  deleteDataset, 
  getDatasets, 
  getDatasetSummary, 
  getDatasetById, 
  getUploadHistory, 
  getDatasetHistory 
} from './dataset.controller';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';

export const datasetRouter = Router();
export const uploadHistoryRouter = Router();

// --- DATASET ROUTES (/api/datasets) ---
datasetRouter.use(authMiddleware);

datasetRouter.get('/summary', asyncHandler(getDatasetSummary));
datasetRouter.get('/', asyncHandler(getDatasets));
datasetRouter.get('/:datasetId', asyncHandler(getDatasetById));
datasetRouter.get('/:datasetId/history', asyncHandler(getDatasetHistory));
datasetRouter.delete('/:datasetId', asyncHandler(deleteDataset));

// --- UPLOAD HISTORY ROUTES (/api/upload-history) ---
uploadHistoryRouter.use(authMiddleware);

uploadHistoryRouter.get('/', asyncHandler(getUploadHistory));
