import { Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { TraderPerformanceService } from './trader-performance.service';

export const uploadTradeReports = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const scriptPath = path.join(__dirname, '../../scripts/parse_trade_report.py');
    const filePaths = files.map(f => f.path);
    const venvPythonPath = path.join(__dirname, '../../../venv/bin/python');
    const pythonExecutable = require('fs').existsSync(venvPythonPath) ? venvPythonPath : 'python3';

    const pythonProcess = spawn(pythonExecutable, [scriptPath, ...filePaths]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: 'Failed to process PDFs', details: errorString });
      }
      try {
        const result = JSON.parse(dataString);
        res.status(200).json(result);
      } catch (err) {
        res.status(500).json({ error: 'Invalid output from parser script' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export class TraderPerformanceController {
  static async getAll(req: Request, res: Response) {
    try {
      const entries = await TraderPerformanceService.getAll();
      return res.status(200).json({ success: true, data: entries });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const entry = await TraderPerformanceService.getById(req.params.id);
      if (!entry) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, data: entry });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const entry = await TraderPerformanceService.create({ ...req.body, createdBy: req.user?.username });
      return res.status(201).json({ success: true, data: entry });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const entry = await TraderPerformanceService.update(req.params.id, { ...req.body, updatedBy: req.user?.username });
      return res.status(200).json({ success: true, data: entry });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await TraderPerformanceService.delete(req.params.id);
      return res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getClientOverview(req: Request, res: Response) {
    try {
      const overview = await TraderPerformanceService.getClientOverview(req.params.id);
      return res.status(200).json({ success: true, data: overview });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getResourceDefaults(req: Request, res: Response) {
    try {
      const defaults = await TraderPerformanceService.getResourceDefaults(req.query as any);
      return res.status(200).json({ success: true, data: defaults });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
