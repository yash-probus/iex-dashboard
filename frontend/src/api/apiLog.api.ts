import { apiClient } from './client';

export interface ApiLog {
  id: string;
  apiName: string;
  endpoint: string | null;
  status: 'SUCCESS' | 'ERROR';
  message: string | null;
  createdAt: string;
}

export const fetchApiLogs = async (
  page: number = 1,
  limit: number = 100,
  startDate?: string,
  endDate?: string,
  apiName?: string
): Promise<{ data: ApiLog[], total: number }> => {
  const response = await apiClient.get('/logs', {
    params: { page, limit, startDate, endDate, apiName }
  });
  return response.data;
};

export const fetchUniqueApiNames = async (): Promise<string[]> => {
  const response = await apiClient.get('/logs/api-names');
  return response.data;
};
