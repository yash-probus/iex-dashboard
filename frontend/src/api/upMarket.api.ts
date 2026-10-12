import { apiClient } from './client';

export const upMarketApi = {
  getMarketData: async (market: string, startDate: string, endDate: string, state?: string) => {
    let url = `/up-market/${market.toLowerCase()}?startDate=${startDate}&endDate=${endDate}`;
    if (state) {
      url += `&state=${encodeURIComponent(state)}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  }
};
