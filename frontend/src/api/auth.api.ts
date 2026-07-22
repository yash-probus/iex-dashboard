import { apiClient } from './client';

export interface AppUser {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AppUser;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', { username, password });
    return response.data;
  }
};
