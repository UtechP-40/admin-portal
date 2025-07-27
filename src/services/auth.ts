import { apiService } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiService.post<AuthResponse>(
      '/auth/login',
      credentials
    );

    // Store tokens
    localStorage.setItem('adminToken', response.data.token);
    localStorage.setItem('adminRefreshToken', response.data.refreshToken);

    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API call success
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
    }
  },

  // Refresh token
  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = localStorage.getItem('adminRefreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiService.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });

    // Update stored tokens
    localStorage.setItem('adminToken', response.data.token);
    localStorage.setItem('adminRefreshToken', response.data.refreshToken);

    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiService.get<User>('/auth/me');
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('adminToken');
    return !!token;
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('adminToken');
  },

  // Password reset
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiService.post('/auth/password-reset-request', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiService.post('/auth/password-reset', { token, newPassword });
  },
};

export default authService;
