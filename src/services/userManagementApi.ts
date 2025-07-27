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

  // Role Templates
  async getRoleTemplates(): Promise<RoleTemplate[]> {
    const response = await apiClient.get('/user-management/role-templates');
    return response.data.data;
  },

  async createRoleTemplate(data: {
    name: string;
    description: string;
    permissions: string[];
    isDefault?: boolean;
  }): Promise<void> {
    await apiClient.post('/user-management/role-templates', data);
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
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/user-management/game-users', { params });
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
  }
};