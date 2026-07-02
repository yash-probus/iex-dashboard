import { apiClient } from './client';

export interface MarketOperation {
  id: string;
  date: string;
  timeblock: number;
  damMcp: string | number;
  rtmMcp: string | number;
  gdamMcp: string | number;
  createdAt: string;
  updatedAt: string;
}

export const fetchMarketOperations = async (startDate?: string, endDate?: string): Promise<MarketOperation[]> => {
  const response = await apiClient.get('/market-operations', {
    params: { startDate, endDate }
  });
  return response.data.data;
};

export const uploadMarketOperations = async (file: File): Promise<{ success: boolean; count: number; message?: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/market-operations/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};
