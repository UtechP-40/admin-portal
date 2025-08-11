import { apiService } from './api';
import type {
  MultiFactorAuthSettings,
  MFADevice,
  MFAMethod,
  IPRestrictionSettings,
  IPRestriction,
  SessionSettings,
  UserSession,
  AccessAttempt,
  TrustedDevice,
  AccessControlPolicy,
  AccessControlMetrics,
  GeolocationInfo,
  AccessAttemptType,
  SessionSecurityLevel,
} from '../types/accessControl';

export const accessControlService = {
  // Multi-Factor Authentication
  getMFASettings: async (): Promise<MultiFactorAuthSettings> => {
    const response = await apiService.get('/access-control/mfa/settings');
    return response.data;
  },

  updateMFASettings: async (settings: Partial<MultiFactorAuthSettings>): Promise<MultiFactorAuthSettings> => {
    const response = await apiService.patch('/access-control/mfa/settings', settings);
    return response.data;
  },

  getMFADevices: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    method?: MFAMethod;
    isActive?: boolean;
  }): Promise<{
    devices: MFADevice[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/access-control/mfa/devices', { params });
    return response.data;
  },

  getUserMFADevices: async (userId: string): Promise<MFADevice[]> => {
    const response = await apiService.get(`/access-control/mfa/devices/user/${userId}`);
    return response.data;
  },

  enableMFAForUser: async (userId: string, method: MFAMethod, deviceName: string): Promise<{
    device: MFADevice;
    setupData: any; // QR code, phone number, etc.
  }> => {
    const response = await apiService.post(`/access-control/mfa/enable`, {
      userId,
      method,
      deviceName,
    });
    return response.data;
  },

  verifyMFASetup: async (deviceId: string, verificationCode: string): Promise<MFADevice> => {
    const response = await apiService.post(`/access-control/mfa/verify-setup`, {
      deviceId,
      verificationCode,
    });
    return response.data;
  },

  disableMFADevice: async (deviceId: string): Promise<void> => {
    await apiService.delete(`/access-control/mfa/devices/${deviceId}`);
  },

  generateBackupCodes: async (userId: string): Promise<string[]> => {
    const response = await apiService.post(`/access-control/mfa/backup-codes`, { userId });
    return response.data.codes;
  },

  // IP Restrictions
  getIPRestrictionSettings: async (): Promise<IPRestrictionSettings> => {
    const response = await apiService.get('/access-control/ip-restrictions/settings');
    return response.data;
  },

  updateIPRestrictionSettings: async (settings: Partial<IPRestrictionSettings>): Promise<IPRestrictionSettings> => {
    const response = await apiService.patch('/access-control/ip-restrictions/settings', settings);
    return response.data;
  },

  getIPRestrictions: async (type: 'whitelist' | 'blacklist'): Promise<IPRestriction[]> => {
    const response = await apiService.get(`/access-control/ip-restrictions/${type}`);
    return response.data;
  },

  addIPRestriction: async (type: 'whitelist' | 'blacklist', restriction: Omit<IPRestriction, 'id' | 'createdAt'>): Promise<IPRestriction> => {
    const response = await apiService.post(`/access-control/ip-restrictions/${type}`, restriction);
    return response.data;
  },

  updateIPRestriction: async (id: string, restriction: Partial<IPRestriction>): Promise<IPRestriction> => {
    const response = await apiService.patch(`/access-control/ip-restrictions/${id}`, restriction);
    return response.data;
  },

  deleteIPRestriction: async (id: string): Promise<void> => {
    await apiService.delete(`/access-control/ip-restrictions/${id}`);
  },

  checkIPRestriction: async (ipAddress: string): Promise<{
    allowed: boolean;
    reason?: string;
    restriction?: IPRestriction;
  }> => {
    const response = await apiService.post('/access-control/ip-restrictions/check', { ipAddress });
    return response.data;
  },

  // Geolocation
  getGeolocationInfo: async (ipAddress: string): Promise<GeolocationInfo> => {
    const response = await apiService.get(`/access-control/geolocation/${ipAddress}`);
    return response.data;
  },

  // Session Management
  getSessionSettings: async (): Promise<SessionSettings> => {
    const response = await apiService.get('/access-control/sessions/settings');
    return response.data;
  },

  updateSessionSettings: async (settings: Partial<SessionSettings>): Promise<SessionSettings> => {
    const response = await apiService.patch('/access-control/sessions/settings', settings);
    return response.data;
  },

  getUserSessions: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    isActive?: boolean;
    ipAddress?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    sessions: UserSession[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/access-control/sessions', { params });
    return response.data;
  },

  getActiveSessionsCount: async (): Promise<number> => {
    const response = await apiService.get('/access-control/sessions/active/count');
    return response.data.count;
  },

  getUserActiveSessions: async (userId: string): Promise<UserSession[]> => {
    const response = await apiService.get(`/access-control/sessions/user/${userId}/active`);
    return response.data;
  },

  terminateSession: async (sessionId: string): Promise<void> => {
    await apiService.delete(`/access-control/sessions/${sessionId}`);
  },

  terminateUserSessions: async (userId: string, excludeCurrentSession?: boolean): Promise<{
    terminatedCount: number;
  }> => {
    const response = await apiService.delete(`/access-control/sessions/user/${userId}`, {
      data: { excludeCurrentSession },
    });
    return response.data;
  },

  terminateAllSessions: async (): Promise<{
    terminatedCount: number;
  }> => {
    const response = await apiService.delete('/access-control/sessions/all');
    return response.data;
  },

  extendSession: async (sessionId: string, minutes: number): Promise<UserSession> => {
    const response = await apiService.patch(`/access-control/sessions/${sessionId}/extend`, { minutes });
    return response.data;
  },

  // Access Attempts
  getAccessAttempts: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    ipAddress?: string;
    attemptType?: AccessAttemptType;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    attempts: AccessAttempt[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/access-control/access-attempts', { params });
    return response.data;
  },

  getFailedLoginAttempts: async (params?: {
    page?: number;
    limit?: number;
    ipAddress?: string;
    timeWindow?: number; // minutes
  }): Promise<{
    attempts: AccessAttempt[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/access-control/access-attempts/failed', { params });
    return response.data;
  },

  // Trusted Devices
  getTrustedDevices: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    isActive?: boolean;
  }): Promise<{
    devices: TrustedDevice[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/access-control/trusted-devices', { params });
    return response.data;
  },

  getUserTrustedDevices: async (userId: string): Promise<TrustedDevice[]> => {
    const response = await apiService.get(`/access-control/trusted-devices/user/${userId}`);
    return response.data;
  },

  trustDevice: async (userId: string, deviceInfo: {
    deviceName: string;
    deviceFingerprint: string;
    ipAddress: string;
    userAgent: string;
    trustLevel: 'low' | 'medium' | 'high';
  }): Promise<TrustedDevice> => {
    const response = await apiService.post('/access-control/trusted-devices', {
      userId,
      ...deviceInfo,
    });
    return response.data;
  },

  revokeTrustedDevice: async (deviceId: string): Promise<void> => {
    await apiService.delete(`/access-control/trusted-devices/${deviceId}`);
  },

  updateTrustedDevice: async (deviceId: string, updates: Partial<TrustedDevice>): Promise<TrustedDevice> => {
    const response = await apiService.patch(`/access-control/trusted-devices/${deviceId}`, updates);
    return response.data;
  },

  // Access Control Policies
  getAccessControlPolicies: async (): Promise<AccessControlPolicy[]> => {
    const response = await apiService.get('/access-control/policies');
    return response.data;
  },

  createAccessControlPolicy: async (policy: Omit<AccessControlPolicy, 'id' | 'createdAt' | 'updatedAt' | 'appliedCount' | 'lastAppliedAt'>): Promise<AccessControlPolicy> => {
    const response = await apiService.post('/access-control/policies', policy);
    return response.data;
  },

  updateAccessControlPolicy: async (id: string, policy: Partial<AccessControlPolicy>): Promise<AccessControlPolicy> => {
    const response = await apiService.patch(`/access-control/policies/${id}`, policy);
    return response.data;
  },

  deleteAccessControlPolicy: async (id: string): Promise<void> => {
    await apiService.delete(`/access-control/policies/${id}`);
  },

  testAccessControlPolicy: async (policyId: string, testData: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    location?: any;
  }): Promise<{
    matched: boolean;
    actions: string[];
    details: string;
  }> => {
    const response = await apiService.post(`/access-control/policies/${policyId}/test`, testData);
    return response.data;
  },

  // Metrics and Analytics
  getAccessControlMetrics: async (timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<AccessControlMetrics> => {
    const response = await apiService.get('/access-control/metrics', { params: timeRange });
    return response.data;
  },

  // Account Lockout
  lockUserAccount: async (userId: string, reason: string, duration?: number): Promise<void> => {
    await apiService.post(`/access-control/lockout/lock`, {
      userId,
      reason,
      duration, // minutes, undefined = permanent
    });
  },

  unlockUserAccount: async (userId: string, reason: string): Promise<void> => {
    await apiService.post(`/access-control/lockout/unlock`, {
      userId,
      reason,
    });
  },

  getLockedAccounts: async (): Promise<Array<{
    userId: string;
    username: string;
    lockedAt: Date;
    lockedBy: string;
    reason: string;
    expiresAt?: Date;
  }>> => {
    const response = await apiService.get('/access-control/lockout/locked');
    return response.data;
  },

  // Password Policies
  getPasswordPolicy: async (): Promise<{
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuse: number;
    maxAge: number; // days
    requireChangeOnFirstLogin: boolean;
    lockoutThreshold: number;
    lockoutDuration: number; // minutes
  }> => {
    const response = await apiService.get('/access-control/password-policy');
    return response.data;
  },

  updatePasswordPolicy: async (policy: any): Promise<void> => {
    await apiService.patch('/access-control/password-policy', policy);
  },

  // Force password change
  forcePasswordChange: async (userId: string, reason: string): Promise<void> => {
    await apiService.post('/access-control/force-password-change', {
      userId,
      reason,
    });
  },

  // Bulk operations
  bulkTerminateSessions: async (sessionIds: string[]): Promise<{
    terminatedCount: number;
    errors: string[];
  }> => {
    const response = await apiService.post('/access-control/sessions/bulk-terminate', {
      sessionIds,
    });
    return response.data;
  },

  bulkRevokeTrustedDevices: async (deviceIds: string[]): Promise<{
    revokedCount: number;
    errors: string[];
  }> => {
    const response = await apiService.post('/access-control/trusted-devices/bulk-revoke', {
      deviceIds,
    });
    return response.data;
  },

  // Real-time monitoring
  subscribeToAccessEvents: (callback: (event: any) => void): () => void => {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll simulate with polling
    const interval = setInterval(async () => {
      try {
        const response = await apiService.get('/access-control/events/recent');
        const events = response.data;
        events.forEach(callback);
      } catch (error) {
        console.error('Failed to fetch recent access events:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  },
};

export default accessControlService;