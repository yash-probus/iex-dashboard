import { Router } from 'express';
import multer from 'multer';
import { MarketOperationsController } from './market-operations.controller';

const router = Router();
const controller = new MarketOperationsController();
const upload = multer({ dest: 'uploads/' });

router.get('/', controller.getRecords.bind(controller));
router.post('/upload', upload.single('file'), controller.uploadRecords.bind(controller));

export default router;
