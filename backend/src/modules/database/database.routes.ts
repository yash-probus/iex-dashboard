import { Router } from 'express';
import { DatabaseController } from './database.controller';

const router = Router();
const databaseController = new DatabaseController();

router.get('/demand', (req, res) => databaseController.getDemandData(req, res));
router.get('/weather', (req, res) => databaseController.getWeatherData(req, res));
router.get('/export/csv', (req, res) => databaseController.exportCSV(req, res));

export default router;
