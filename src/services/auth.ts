import { apiService, TokenStorage, TokenManager } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
  deviceId?: string;
  trustDevice?: boolean;
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
  mfaRequired?: boolean;
  mfaToken?: string;
  availableMethods?: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

// Session timeout management
class SessionManager {
  private static timeoutId: NodeJS.Timeout | null = null;
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

  static startSessionTimer() {
    this.clearSessionTimer();
    
    // Set warning timer
    const warningTimeoutId = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('auth:session-warning', {
        detail: { remainingTime: this.WARNING_TIME }
      }));
    }, this.SESSION_TIMEOUT - this.WARNING_TIME);

    // Set logout timer
    this.timeoutId = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      TokenManager.handleLogout();
    }, this.SESSION_TIMEOUT);
  }

  static clearSessionTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  static resetSessionTimer() {
    this.startSessionTimer();
  }
}

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiService.post<AuthResponse>(
        '/auth/login',
        credentials
      );

      // Store tokens using secure storage
      TokenStorage.setTokens(response.data.token, response.data.refreshToken);
      
      // Start session management
      SessionManager.startSessionTimer();

      // Initialize audit context
      const { auditService } = await import('./auditService');
      auditService.initializeContext({
        userId: response.data.user.id,
        userEmail: response.data.user.email,
        userName: response.data.user.name,
        userRole: response.data.user.role,
      });

      // Log successful login
      await auditService.logLogin(credentials.email, true);

      // Dispatch login event
      window.dispatchEvent(new CustomEvent('auth:login', {
        detail: { user: response.data.user }
      }));

      return response.data;
    } catch (error: any) {
      // Log failed login attempt
      const { auditService } = await import('./auditService');
      await auditService.logLogin(
        credentials.email, 
        false, 
        error.response?.data?.message || error.message
      );
      throw error;
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    // Get current user info for audit logging
    let userEmail = '';
    try {
      const user = await authService.getCurrentUser();
      userEmail = user.email;
    } catch (error) {
      // User info might not be available, continue with logout
    }

    try {
      // Notify server about logout
      await apiService.post('/auth/logout', {
        refreshToken: TokenStorage.getRefreshToken()
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Log logout event before clearing context
      if (userEmail) {
        try {
          const { auditService } = await import('./auditService');
          await auditService.logLogout(userEmail);
        } catch (error) {
          console.error('Failed to log logout event:', error);
        }
      }

      // Clear session timer
      SessionManager.clearSessionTimer();
      
      // Clear audit context
      try {
        const { auditService } = await import('./auditService');
        auditService.clearContext();
      } catch (error) {
        console.error('Failed to clear audit context:', error);
      }
      
      // Use TokenManager for consistent logout handling
      TokenManager.handleLogout();
    }
  },

  // Refresh token (delegated to TokenManager)
  refreshToken: async (): Promise<AuthResponse> => {
    const newToken = await TokenManager.refreshToken();
    
    // Reset session timer on successful refresh
    SessionManager.resetSessionTimer();
    
    // Get user info with new token
    const user = await authService.getCurrentUser();
    
    return {
      token: newToken,
      refreshToken: TokenStorage.getRefreshToken()!,
      user
    };
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiService.get<User>('/auth/me');
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = TokenStorage.getAccessToken();
    if (!token) return false;

    try {
      // Basic JWT expiration check
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.warn('Token validation error:', error);
      return false;
    }
  },

  // Get stored token
  getToken: (): string | null => {
    return TokenStorage.getAccessToken();
  },

  // Extend session (reset timeout)
  extendSession: (): void => {
    if (authService.isAuthenticated()) {
      SessionManager.resetSessionTimer();
    }
  },

  // Password reset
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiService.post('/auth/password-reset-request', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiService.post('/auth/password-reset', { token, newPassword });
  },

  // Register
  register: async (data: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ message: string; email: string }> => {
    const response = await apiService.post('/auth/register', data);
    return response.data;
  },

  // MFA Methods
  verifyMFA: async (mfaToken: string, mfaCode: string, deviceId?: string, trustDevice?: boolean): Promise<AuthResponse> => {
    try {
      const response = await apiService.post<AuthResponse>('/auth/mfa/verify', {
        mfaToken,
        mfaCode,
        deviceId,
        trustDevice,
      });

      // Store tokens using secure storage
      TokenStorage.setTokens(response.data.token, response.data.refreshToken);
      
      // Start session management
      SessionManager.startSessionTimer();

      // Initialize audit context
      const { auditService } = await import('./auditService');
      auditService.initializeContext({
        userId: response.data.user.id,
        userEmail: response.data.user.email,
        userName: response.data.user.name,
        userRole: response.data.user.role,
      });

      // Log successful MFA verification
      await auditService.logMFAVerification(response.data.user.email, true);

      // Dispatch login event
      window.dispatchEvent(new CustomEvent('auth:login', {
        detail: { user: response.data.user }
      }));

      return response.data;
    } catch (error: any) {
      // Log failed MFA verification
      const { auditService } = await import('./auditService');
      await auditService.logMFAVerification(
        'unknown', // We don't have user email in this context
        false,
        error.response?.data?.message || error.message
      );
      throw error;
    }
  },

  resendMFACode: async (mfaToken: string, method?: string): Promise<{ message: string }> => {
    const response = await apiService.post('/auth/mfa/resend', {
      mfaToken,
      method,
    });
    return response.data;
  },

  // Session Management
  getCurrentSession: async (): Promise<{
    id: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    lastActivityAt: string;
    expiresAt: string;
    isCurrent: boolean;
  }> => {
    const response = await apiService.get('/auth/session/current');
    return response.data;
  },

  // Device Trust Management
  getTrustedDevices: async (): Promise<Array<{
    id: string;
    deviceName: string;
    deviceFingerprint: string;
    trustedAt: string;
    lastUsedAt: string;
    isActive: boolean;
  }>> => {
    const response = await apiService.get('/auth/trusted-devices');
    return response.data;
  },

  revokeTrustedDevice: async (deviceId: string): Promise<void> => {
    await apiService.delete(`/auth/trusted-devices/${deviceId}`);
  },

  // IP and Location Validation
  validateAccess: async (): Promise<{
    allowed: boolean;
    reason?: string;
    requiresMFA: boolean;
    riskScore: number;
    location?: {
      country: string;
      region: string;
      city: string;
    };
  }> => {
    const response = await apiService.post('/auth/validate-access');
    return response.data;
  },
};

export default authService;
