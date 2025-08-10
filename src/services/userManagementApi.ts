import apiClient from './api';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  permissions: string[];
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameUser {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  gamesPlayed: number;
  winRate: number;
  createdAt: string;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  usersByStatus: Record<string, number>;
  usersByPermission: Record<string, number>;
  recentLogins: number;
}

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  parentRoleId?: string;
  inheritedPermissions?: string[];
  level: number;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface CreateAdminUserData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  permissions: string[];
}

export interface UpdateAdminUserData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  permissions?: string[];
  status?: string;
}

export const userManagementApi = {
  // Admin Users
  async getAdminUsers(params?: {
    username?: string;
    email?: string;
    status?: string;
    permissions?: string[];
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/user-management/admin-users', { params });
    return response.data.data;
  },

  async getAdminUser(id: string): Promise<AdminUser> {
    const response = await apiClient.get(`/user-management/admin-users/${id}`);
    return response.data.data;
  },

  async createAdminUser(data: CreateAdminUserData): Promise<AdminUser> {
    const response = await apiClient.post('/user-management/admin-users', data);
    return response.data.data;
  },

  async updateAdminUser(id: string, data: UpdateAdminUserData): Promise<AdminUser> {
    const response = await apiClient.put(`/user-management/admin-users/${id}`, data);
    return response.data.data;
  },

  async deleteAdminUser(id: string): Promise<void> {
    await apiClient.delete(`/user-management/admin-users/${id}`);
  },

  async assignPermissions(id: string, permissions: string[]): Promise<AdminUser> {
    const response = await apiClient.post(`/user-management/admin-users/${id}/permissions`, {
      permissions
    });
    return response.data.data;
  },

  async revokePermissions(id: string, permissions: string[]): Promise<AdminUser> {
    const response = await apiClient.delete(`/user-management/admin-users/${id}/permissions`, {
      data: { permissions }
    });
    return response.data.data;
  },

  // Role Templates - Complete CRUD Operations
  async getRoleTemplates(): Promise<RoleTemplate[]> {
    const response = await apiClient.get('/user-management/role-templates');
    return response.data.data;
  },

  async getRoleTemplate(id: string): Promise<RoleTemplate> {
    const response = await apiClient.get(`/user-management/role-templates/${id}`);
    return response.data.data;
  },

  async createRoleTemplate(data: {
    name: string;
    description: string;
    permissions: string[];
    parentRoleId?: string;
    isDefault?: boolean;
  }): Promise<RoleTemplate> {
    const response = await apiClient.post('/user-management/role-templates', data);
    return response.data.data;
  },

  async updateRoleTemplate(id: string, data: {
    name?: string;
    description?: string;
    permissions?: string[];
    parentRoleId?: string;
    isDefault?: boolean;
  }): Promise<RoleTemplate> {
    const response = await apiClient.put(`/user-management/role-templates/${id}`, data);
    return response.data.data;
  },

  async deleteRoleTemplate(id: string): Promise<void> {
    await apiClient.delete(`/user-management/role-templates/${id}`);
  },

  async duplicateRoleTemplate(id: string, newName: string): Promise<RoleTemplate> {
    const response = await apiClient.post(`/user-management/role-templates/${id}/duplicate`, {
      name: newName
    });
    return response.data.data;
  },

  // Role Hierarchy and Inheritance
  async getRoleHierarchy(): Promise<{
    roles: RoleTemplate[];
    hierarchy: { [key: string]: string[] };
  }> {
    const response = await apiClient.get('/user-management/role-templates/hierarchy');
    return response.data.data;
  },

  async getEffectivePermissions(roleId: string): Promise<{
    directPermissions: string[];
    inheritedPermissions: string[];
    effectivePermissions: string[];
    inheritancePath: string[];
  }> {
    const response = await apiClient.get(`/user-management/role-templates/${roleId}/effective-permissions`);
    return response.data.data;
  },

  async validateRoleHierarchy(parentRoleId: string, childRoleId: string): Promise<{
    isValid: boolean;
    wouldCreateCycle: boolean;
    conflictingPermissions: string[];
  }> {
    const response = await apiClient.post('/user-management/role-templates/validate-hierarchy', {
      parentRoleId,
      childRoleId
    });
    return response.data.data;
  },

  // Role Assignment and Bulk Operations
  async assignRoleToUser(userId: string, roleId: string): Promise<AdminUser> {
    const response = await apiClient.post(`/user-management/admin-users/${userId}/assign-role`, {
      roleId
    });
    return response.data.data;
  },

  async assignRoleToUsers(userIds: string[], roleId: string): Promise<{
    successful: string[];
    failed: { userId: string; error: string }[];
  }> {
    const response = await apiClient.post('/user-management/admin-users/bulk-assign-role', {
      userIds,
      roleId
    });
    return response.data.data;
  },

  async removeRoleFromUser(userId: string, roleId: string): Promise<AdminUser> {
    const response = await apiClient.delete(`/user-management/admin-users/${userId}/roles/${roleId}`);
    return response.data.data;
  },

  async bulkUpdatePermissions(updates: {
    userIds: string[];
    addPermissions?: string[];
    removePermissions?: string[];
    replacePermissions?: string[];
  }): Promise<{
    successful: string[];
    failed: { userId: string; error: string }[];
  }> {
    const response = await apiClient.post('/user-management/admin-users/bulk-update-permissions', updates);
    return response.data.data;
  },

  async getUsersByRole(roleId: string): Promise<AdminUser[]> {
    const response = await apiClient.get(`/user-management/role-templates/${roleId}/users`);
    return response.data.data;
  },

  async getRoleUsageStatistics(): Promise<{
    roleUsage: { roleId: string; roleName: string; userCount: number }[];
    permissionUsage: { permission: string; userCount: number; roleCount: number }[];
    orphanedUsers: number;
    duplicatePermissions: { userId: string; permissions: string[] }[];
  }> {
    const response = await apiClient.get('/user-management/role-templates/usage-statistics');
    return response.data.data;
  },

  // User Statistics
  async getUserStatistics(): Promise<UserStatistics> {
    const response = await apiClient.get('/user-management/statistics');
    return response.data.data;
  },

  // Game Users
  async getGameUsers(params?: {
    username?: string;
    email?: string;
    isActive?: boolean;
    isBanned?: boolean;
    riskLevel?: string;
    gamesPlayedMin?: number;
    gamesPlayedMax?: number;
    winRateMin?: number;
    winRateMax?: number;
    joinedAfter?: string;
    joinedBefore?: string;
    lastActiveAfter?: string;
    lastActiveBefore?: string;
    suspiciousActivityScoreMin?: number;
    suspiciousActivityScoreMax?: number;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/user-management/game-users', { params });
    return response.data.data;
  },

  async getGameUserStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    highRiskUsers: number;
    usersByRiskLevel: Record<string, number>;
    averageGamesPlayed: number;
    averageWinRate: number;
  }> {
    const response = await apiClient.get('/user-management/game-users/statistics');
    return response.data.data;
  },

  async banGameUser(id: string, reason: string, duration?: number): Promise<void> {
    await apiClient.post(`/user-management/game-users/${id}/ban`, {
      reason,
      duration
    });
  },

  async unbanGameUser(id: string): Promise<void> {
    await apiClient.post(`/user-management/game-users/${id}/unban`);
  },

  async flagGameUser(id: string, reason: string, severity: 'low' | 'medium' | 'high'): Promise<void> {
    await apiClient.post(`/user-management/game-users/${id}/flag`, {
      reason,
      severity
    });
  },

  async unflagGameUser(id: string): Promise<void> {
    await apiClient.post(`/user-management/game-users/${id}/unflag`);
  },

  // Bulk Operations
  async bulkAssignPermissions(userIds: string[], permissions: string[]) {
    const response = await apiClient.post('/user-management/admin-users/bulk-assign-permissions', {
      userIds,
      permissions
    });
    return response.data.data;
  },

  async bulkUpdateStatus(userIds: string[], status: string) {
    const response = await apiClient.post('/user-management/admin-users/bulk-update-status', {
      userIds,
      status
    });
    return response.data.data;
  },

  async bulkImportUsers(users: any[]) {
    const response = await apiClient.post('/user-management/admin-users/bulk-import', {
      users
    });
    return response.data.data;
  },

  async exportUsers(userIds: string[], format: string, options?: any) {
    const response = await apiClient.post('/user-management/admin-users/export', {
      userIds,
      format,
      options
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Email Verification
  async sendEmailVerification(userId: string, options?: {
    customMessage?: string;
    includeLoginInstructions?: boolean;
    sendWelcomeEmail?: boolean;
  }) {
    const response = await apiClient.post(`/user-management/admin-users/${userId}/send-verification`, options);
    return response.data.data;
  },

  async resendEmailVerification(userId: string) {
    const response = await apiClient.post(`/user-management/admin-users/${userId}/resend-verification`);
    return response.data.data;
  },

  async getEmailVerificationStatus(userId: string) {
    const response = await apiClient.get(`/user-management/admin-users/${userId}/verification-status`);
    return response.data.data;
  },

  async markEmailAsVerified(userId: string) {
    const response = await apiClient.post(`/user-management/admin-users/${userId}/mark-verified`);
    return response.data.data;
  },

  // User Activity and Sessions
  async getUserActivityLogs(params?: {
    userId?: string;
    timeRange?: string;
    activityType?: string;
  }) {
    const response = await apiClient.get('/user-management/activity-logs', { params });
    return response.data.data;
  },

  async getUserActivityStats(params?: {
    userId?: string;
    timeRange?: string;
  }) {
    const response = await apiClient.get('/user-management/activity-stats', { params });
    return response.data.data;
  },

  async getUserSessions(userId?: string, options?: { filter?: string }) {
    const params = userId ? { userId, ...options } : options;
    const response = await apiClient.get('/user-management/sessions', { params });
    return response.data.data;
  },

  async getSessionStatistics(userId?: string) {
    const params = userId ? { userId } : {};
    const response = await apiClient.get('/user-management/session-statistics', { params });
    return response.data.data;
  },

  async terminateSession(sessionId: string) {
    const response = await apiClient.delete(`/user-management/sessions/${sessionId}`);
    return response.data.data;
  },

  async bulkTerminateSessions(sessionIds: string[]) {
    const response = await apiClient.post('/user-management/sessions/bulk-terminate', {
      sessionIds
    });
    return response.data.data;
  },

  async blockSuspiciousSessions(userId?: string) {
    const response = await apiClient.post('/user-management/sessions/block-suspicious', {
      userId
    });
    return response.data.data;
  },

  // User Behavior Analytics
  async getUserBehaviorAnalytics(params?: {
    userId?: string;
    timeRange?: string;
    metricType?: string;
  }) {
    const response = await apiClient.get('/user-management/behavior-analytics', { params });
    return response.data.data;
  },

  async getFlaggedUsers(params?: {
    severity?: string;
    reason?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/user-management/flagged-users', { params });
    return response.data.data;
  },

  async getBehaviorPatterns(timeRange?: string) {
    const response = await apiClient.get('/user-management/behavior-patterns', {
      params: { timeRange }
    });
    return response.data.data;
  },

  // Automated Moderation
  async getModerationRules() {
    const response = await apiClient.get('/user-management/moderation-rules');
    return response.data.data;
  },

  async createModerationRule(rule: {
    name: string;
    description: string;
    conditions: any[];
    actions: any[];
    severity: 'low' | 'medium' | 'high';
    isActive: boolean;
  }) {
    const response = await apiClient.post('/user-management/moderation-rules', rule);
    return response.data.data;
  },

  async updateModerationRule(id: string, rule: any) {
    const response = await apiClient.put(`/user-management/moderation-rules/${id}`, rule);
    return response.data.data;
  },

  async deleteModerationRule(id: string) {
    await apiClient.delete(`/user-management/moderation-rules/${id}`);
  },

  async toggleModerationRule(id: string, isActive: boolean) {
    const response = await apiClient.patch(`/user-management/moderation-rules/${id}/toggle`, {
      isActive
    });
    return response.data.data;
  },

  async getModerationActions(params?: {
    userId?: string;
    ruleId?: string;
    timeRange?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/user-management/moderation-actions', { params });
    return response.data.data;
  },

  async executeModerationAction(action: {
    userId: string;
    actionType: 'warn' | 'flag' | 'ban' | 'restrict';
    reason: string;
    duration?: number;
    severity?: string;
  }) {
    const response = await apiClient.post('/user-management/moderation-actions/execute', action);
    return response.data.data;
  },

  async bulkModerationAction(userIds: string[], action: {
    actionType: 'warn' | 'flag' | 'ban' | 'restrict';
    reason: string;
    duration?: number;
    severity?: string;
  }) {
    const response = await apiClient.post('/user-management/moderation-actions/bulk', {
      userIds,
      ...action
    });
    return response.data.data;
  },

  async getModerationStatistics(timeRange?: string) {
    const response = await apiClient.get('/user-management/moderation-statistics', {
      params: { timeRange }
    });
    return response.data.data;
  },

  // Advanced Search
  async searchGameUsers(searchCriteria: {
    basicSearch?: {
      username?: string;
      email?: string;
    };
    activityFilters?: {
      gamesPlayedMin?: number;
      gamesPlayedMax?: number;
      winRateMin?: number;
      winRateMax?: number;
      lastActiveAfter?: string;
      lastActiveBefore?: string;
    };
    behaviorFilters?: {
      riskLevel?: string;
      suspiciousActivityScoreMin?: number;
      suspiciousActivityScoreMax?: number;
      flagged?: boolean;
      banned?: boolean;
    };
    dateFilters?: {
      joinedAfter?: string;
      joinedBefore?: string;
    };
    sorting?: {
      field: string;
      direction: 'asc' | 'desc';
    };
    pagination?: {
      page: number;
      limit: number;
    };
  }) {
    const response = await apiClient.post('/user-management/game-users/search', searchCriteria);
    return response.data.data;
  },

  async saveSearchPreset(preset: {
    name: string;
    description?: string;
    searchCriteria: any;
  }) {
    const response = await apiClient.post('/user-management/search-presets', preset);
    return response.data.data;
  },

  async getSearchPresets() {
    const response = await apiClient.get('/user-management/search-presets');
    return response.data.data;
  },

  async deleteSearchPreset(id: string) {
    await apiClient.delete(`/user-management/search-presets/${id}`);
  }
};