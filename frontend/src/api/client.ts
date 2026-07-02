import axios from 'axios';
import { AUTH_TOKEN_KEY } from '../constants/auth';
import { triggerGlobalLogout } from '../utils/events';

const baseURL = (import.meta as any).env.VITE_API_BASE_URL;

if (!baseURL) {
  const errorMsg = 'VITE_API_BASE_URL is not configured.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Deliverable A4: Friendly Network Errors
    if (!error.response) {
      // Network Error, Server Offline, CORS
      
      // Special handling for upload timeouts or Nginx 413 Payload Too Large (which block CORS)
      const isUploadError = error.config?.url?.includes('/upload/dataset');
      const message = isUploadError 
        ? 'Upload failed due to a network error or timeout. The file may be too large, or the connection dropped.'
        : 'Unable to connect to server. Please verify the backend is running.';
        
      const friendlyError = new Error(message);
      return Promise.reject(friendlyError);
    }

    // 401 Unauthorized globally intercepted
    if (error.response.status === 401) {
      triggerGlobalLogout();
    }

    // Attempt to unwrap our backend AppError structure but PRESERVE the Axios error context
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);
