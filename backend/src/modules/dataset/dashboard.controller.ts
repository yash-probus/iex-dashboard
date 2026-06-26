import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

export const getDamData = async (req: Request, res: Response) => {
  const data = await DashboardService.getDashboardData('DAM', req.query.date as string, req.query.interval as string);
  res.status(200).json({ success: true, data });
};

export const getGdamData = async (req: Request, res: Response) => {
  const data = await DashboardService.getDashboardData('GDAM', req.query.date as string, req.query.interval as string);
  res.status(200).json({ success: true, data });
};

export const getRtmData = async (req: Request, res: Response) => {
  const data = await DashboardService.getDashboardData('RTM', req.query.date as string, req.query.interval as string);
  res.status(200).json({ success: true, data });
};

export const getDamAnalytics = async (req: Request, res: Response) => {
  const data = await DashboardService.getAnalytics('DAM', req.query.date as string, req.query.interval as string);
  res.status(200).json({ success: true, data });
};

export const getGdamAnalytics = async (req: Request, res: Response) => {
  const data = await DashboardService.getAnalytics('GDAM', req.query.date as string, req.query.interval as string);
  res.status(200).json({ success: true, data });
};

export const getRtmAnalytics = async (req: Request, res: Response) => {
  const data = await DashboardService.getAnalytics('RTM', req.query.date as string, req.query.interval as string);
  res.status(200).json({ success: true, data });
};

export const getOverviewData = async (req: Request, res: Response) => {
  const data = await DashboardService.getOverview();
  res.status(200).json({ success: true, data });
};
