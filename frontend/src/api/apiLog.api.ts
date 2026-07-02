import { apiClient } from './client';

export interface ApiLog {
  id: string;
  apiName: string;
  endpoint: string | null;
  status: 'SUCCESS' | 'ERROR';
  message: string | null;
  createdAt: string;
}

export const fetchApiLogs = async (limit: number = 100): Promise<ApiLog[]> => {
  const response = await apiClient.get('/logs', {
    params: { limit }
  });
  return response.data;
};
