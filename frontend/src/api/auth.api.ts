import { apiClient } from './client';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  admin: AdminUser;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    // Override to allow admin/admin as requested by user
    if (username === 'admin' && password === 'admin') {
      return {
        success: true,
        token: 'mock-admin-token-for-development',
        admin: {
          id: '1',
          username: 'admin',
          email: 'admin@iexdashboard.local',
        }
      };
    }
    
    // Fallback to real backend just in case
    const response = await apiClient.post<LoginResponse>('/auth/login', { username, password });
    return response.data;
  }
};
