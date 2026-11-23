import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * RUDRA SILVER ERP - Core Axios API Client
 * Configured with automatic authorization headers, timeouts, and centralized error handling.
 */

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: attach bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const stored = localStorage.getItem('rudra_silver_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token && config.headers) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor: centralized error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      // Optional: trigger auth reset without breaking page flow
    }

    const message =
      (error.response?.data as { message?: string; detail?: string })?.message ||
      (error.response?.data as { message?: string; detail?: string })?.detail ||
      error.message ||
      'An unexpected network or server error occurred';

    return Promise.reject(new Error(message));
  }
);

/**
 * Health check helper function for backend and MySQL PDO connectivity
 */
export async function checkBackendHealth(): Promise<{
  success: boolean;
  app_name: string;
  status: string;
  message: string;
  environment: Record<string, any>;
}> {
  const healthUrl = import.meta.env.VITE_BACKEND_HEALTH_URL || 'http://localhost/Rudra-silver/backend/api/health.php';
  const response = await axios.get(healthUrl, { timeout: 8000 });
  return response.data;
}

export default apiClient;
