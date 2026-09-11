import { Router } from 'express';
import { TraderPerformanceController, uploadTradeReports } from './trader-performance.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = path.join(__dirname, '../../../uploads/trader-performance');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// PDF upload route
router.post('/upload', upload.array('files', 31), uploadTradeReports);

// CRUD routes
router.get('/', TraderPerformanceController.getAll);
router.post('/', TraderPerformanceController.create);
router.get('/resource-defaults', TraderPerformanceController.getResourceDefaults);
router.get('/:id', TraderPerformanceController.getById);
router.put('/:id', TraderPerformanceController.update);
router.delete('/:id', TraderPerformanceController.delete);
router.get('/:id/overview', TraderPerformanceController.getClientOverview);

export default router;
