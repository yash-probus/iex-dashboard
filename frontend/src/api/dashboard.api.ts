import { apiClient } from './client';
import { MarketSummary } from '../types/market';
import { DashboardOverviewResponse } from '../types/overview';

export const dashboardApi = {
  getMarketData: async (market: string, date: string, interval: string = '15min') => {
    const response = await apiClient.get(`/dashboard/${market.toLowerCase()}?date=${date}&interval=${interval}`);
    return response.data;
  },
  getMarketAnalytics: async (market: string, date: string, interval: string = '15min') => {
    const response = await apiClient.get(`/dashboard/${market.toLowerCase()}/analytics?date=${date}&interval=${interval}`);
    return response.data;
  },
  getMarketOverview: async (): Promise<DashboardOverviewResponse> => {
    const response = await apiClient.get<DashboardOverviewResponse>('/dashboard/overview');
    return response.data;
  }
};
