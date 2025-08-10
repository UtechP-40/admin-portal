import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/admin/api';

// Token storage utility
class TokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'adminToken';
  private static readonly REFRESH_TOKEN_KEY = 'adminRefreshToken';
  private static readonly USE_COOKIES = import.meta.env.VITE_USE_SECURE_COOKIES === 'true';

  static getAccessToken(): string | null {
    if (this.USE_COOKIES) {
      return this.getCookie(this.ACCESS_TOKEN_KEY);
    }
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (this.USE_COOKIES) {
      return this.getCookie(this.REFRESH_TOKEN_KEY);
    }
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    if (this.USE_COOKIES) {
      this.setCookie(this.ACCESS_TOKEN_KEY, accessToken, { httpOnly: false, secure: true, sameSite: 'strict' });
      this.setCookie(this.REFRESH_TOKEN_KEY, refreshToken, { httpOnly: false, secure: true, sameSite: 'strict' });
    } else {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static clearTokens(): void {
    if (this.USE_COOKIES) {
      this.deleteCookie(this.ACCESS_TOKEN_KEY);
      this.deleteCookie(this.REFRESH_TOKEN_KEY);
    } else {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  private static getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private static setCookie(name: string, value: string, options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
  } = {}): void {
    const { secure = true, sameSite = 'strict', maxAge = 86400 } = options;
    let cookieString = `${name}=${value}; Max-Age=${maxAge}; Path=/`;
    
    if (secure) cookieString += '; Secure';
    if (sameSite) cookieString += `; SameSite=${sameSite}`;
    
    document.cookie = cookieString;
  }

  private static deleteCookie(name: string): void {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

// Token refresh management
class TokenManager {
  private static isRefreshing = false;
  private static failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (error: any) => void;
  }> = [];

  static async refreshToken(): Promise<string> {
    const refreshToken = TokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
      TokenStorage.setTokens(newAccessToken, newRefreshToken);
      
      return newAccessToken;
    } catch (error) {
      TokenStorage.clearTokens();
      throw error;
    }
  }

  static async getValidToken(): Promise<string | null> {
    const token = TokenStorage.getAccessToken();
    if (!token) return null;

    // Check if token is expired (basic check - in production you might want to decode JWT)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // If token expires in less than 5 minutes, refresh it
      if (payload.exp - currentTime < 300) {
        if (this.isRefreshing) {
          // If already refreshing, wait for it to complete
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          });
        }

        this.isRefreshing = true;
        try {
          const newToken = await this.refreshToken();
          this.processQueue(null, newToken);
          return newToken;
        } catch (error) {
          this.processQueue(error, null);
          throw error;
        } finally {
          this.isRefreshing = false;
        }
      }

      return token;
    } catch (error) {
      // If token parsing fails, try to refresh
      try {
        return await this.refreshToken();
      } catch (refreshError) {
        TokenStorage.clearTokens();
        throw refreshError;
      }
    }
  }

  private static processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  static handleLogout() {
    TokenStorage.clearTokens();
    this.isRefreshing = false;
    this.failedQueue = [];
    
    // Dispatch custom event for logout
    window.dispatchEvent(new CustomEvent('auth:logout'));
    
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor with automatic token refresh
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get valid token (will refresh if needed)
      const token = await TokenManager.getValidToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // If token refresh fails, proceed without token
      console.warn('Failed to get valid token:', error);
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors with token refresh retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await TokenManager.refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        TokenManager.handleLogout();
        return Promise.reject(refreshError);
      }
    }

    // Handle other error cases
    if (error.response?.status === 403) {
      console.error('Access forbidden - insufficient permissions');
      // Dispatch custom event for permission error
      window.dispatchEvent(new CustomEvent('auth:forbidden', { 
        detail: { message: error.response.data?.message || 'Access forbidden' }
      }));
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
      // Dispatch custom event for server error
      window.dispatchEvent(new CustomEvent('api:server-error', {
        detail: { 
          status: error.response.status,
          message: error.response.data?.message || 'Server error'
        }
      }));
    }

    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
    });

    return Promise.reject(error);
  }
);

// Export token utilities for use in auth service
export { TokenStorage, TokenManager };

// API service functions
export const apiService = {
  // Generic CRUD operations
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config),

  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config),

  // Generic request method for custom configurations
  request: <T>(config: AxiosRequestConfig) =>
    apiClient.request<T>(config),
};

// Export individual API services
export { userManagementApi } from './userManagementApi';
export { systemConfigurationApi } from './systemConfigurationApi';

export default apiClient;
