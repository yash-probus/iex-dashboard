import { Request, Response } from 'express';
import { loginAdmin } from './auth.service';
import { logger } from '../../logger';

export const login = async (req: Request, res: Response) => {
  try {
    const response = await loginAdmin(req.body);
    logger.info('Admin login successful', { username: req.body.username });
    res.status(200).json(response);
  } catch (error) {
    logger.error('Admin login failed', { username: req.body.username });
    throw error; // Let global error handler catch it
  }
};

export const getMe = async (req: Request, res: Response) => {
  // @ts-ignore - admin injected by auth.middleware
  const admin = req.admin;
  res.status(200).json({
    success: true,
    admin,
  });
};
