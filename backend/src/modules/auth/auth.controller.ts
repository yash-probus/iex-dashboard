import { Request, Response } from 'express';
import { loginUser } from './auth.service';
import { logger } from '../../logger';

export const login = async (req: Request, res: Response) => {
  try {
    const response = await loginUser(req.body);
    logger.info('User login successful', { username: req.body.username });
    res.status(200).json(response);
  } catch (error) {
    logger.error('User login failed', { username: req.body.username });
    throw error; // Let global error handler catch it
  }
};

export const getMe = async (req: Request, res: Response) => {
  // @ts-ignore - user injected by auth.middleware
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
};
