import apiClient from './api';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environments: string[];
  rolloutPercentage?: number;
  targetUsers?: string[];
  conditions?: Record<string, any>;
}

export interface SystemSetting {
  key: string;
  name: string;
  description: string;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: string;
  environment: string;
  isReadOnly?: boolean;
}

export interface Configuration {
  key: string;
  name: string;
  description: string;
  type: string;
  category: string;
  values: Record<string, any>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeatureFlagData {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environments: string[];
  rolloutPercentage?: number;
  targetUsers?: string[];
  conditions?: Record<string, any>;
}

export interface CreateSystemSettingData {
  key: string;
  name: string;
  description: string;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: string;
  environment: string;
  isReadOnly?: boolean;
  validationRules?: Record<string, any>;
}

export const systemConfigurationApi = {
  // Feature Flags
  async getFeatureFlags(environment?: string): Promise<FeatureFlag[]> {
    const response = await apiClient.get(
      '/system-configuration/feature-flags',
      {
        params: { environment },
      }
    );
    return response.data.data;
  },

  async createFeatureFlag(data: CreateFeatureFlagData): Promise<Configuration> {
    const response = await apiClient.post(
      '/system-configuration/feature-flags',
      data
    );
    return response.data.data;
  },

  async updateFeatureFlag(
    key: string,
    environment: string,
    updates: {
      enabled?: boolean;
      rolloutPercentage?: number;
      targetUsers?: string[];
      conditions?: Record<string, any>;
    }
  ): Promise<Configuration> {
    const response = await apiClient.put(
      `/system-configuration/feature-flags/${key}`,
      {
        environment,
        ...updates,
      }
    );
    return response.data.data;
  },

  async getFeatureFlagStatus(
    key: string,
    environment: string,
    context?: {
      userId?: string;
      userAgent?: string;
      country?: string;
      userType?: string;
    }
  ): Promise<{ enabled: boolean }> {
    const response = await apiClient.get(
      `/system-configuration/feature-flags/${key}/status`,
      {
        params: { environment, ...context },
      }
    );
    return response.data.data;
  },

  // System Settings
  async getSystemSettings(
    category?: string,
    environment?: string
  ): Promise<SystemSetting[]> {
    const response = await apiClient.get(
      '/system-configuration/system-settings',
      {
        params: { category, environment },
      }
    );
    return response.data.data;
  },

  async createSystemSetting(
    data: CreateSystemSettingData
  ): Promise<Configuration> {
    const response = await apiClient.post(
      '/system-configuration/system-settings',
      data
    );
    return response.data.data;
  },

  async updateSystemSetting(
    key: string,
    environment: string,
    value: any
  ): Promise<Configuration> {
    const response = await apiClient.put(
      `/system-configuration/system-settings/${key}`,
      {
        environment,
        value,
      }
    );
    return response.data.data;
  },

  async getSystemSetting(
    key: string,
    environment?: string
  ): Promise<{ key: string; value: any }> {
    const response = await apiClient.get(
      `/system-configuration/system-settings/${key}`,
      {
        params: { environment },
      }
    );
    return response.data.data;
  },

  // Configuration Management
  async getAllConfigurations(params?: {
    type?: string;
    environment?: string;
    category?: string;
  }): Promise<Configuration[]> {
    const response = await apiClient.get(
      '/system-configuration/configurations',
      { params }
    );
    return response.data.data;
  },

  async deleteConfiguration(key: string): Promise<void> {
    await apiClient.delete(`/system-configuration/configurations/${key}`);
  },

  async rollbackConfiguration(
    key: string,
    version: number
  ): Promise<Configuration> {
    const response = await apiClient.post(
      `/system-configuration/configurations/${key}/rollback`,
      {
        version,
      }
    );
    return response.data.data;
  },

  // Environment Management
  async getEnvironments(): Promise<string[]> {
    const response = await apiClient.get('/system-configuration/environments');
    return response.data.data;
  },

  async syncConfiguration(
    key: string,
    sourceEnvironment: string,
    targetEnvironments: string[]
  ): Promise<void> {
    await apiClient.post(`/system-configuration/configurations/${key}/sync`, {
      sourceEnvironment,
      targetEnvironments,
    });
  },

  // Export/Import
  async exportConfigurations(params?: {
    environment?: string;
    type?: string;
  }): Promise<Blob> {
    const response = await apiClient.get('/system-configuration/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  async importConfigurations(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    await apiClient.post('/system-configuration/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Metadata
  async getCategories(): Promise<string[]> {
    const response = await apiClient.get('/system-configuration/categories');
    return response.data.data;
  },

  async getDataTypes(): Promise<string[]> {
    const response = await apiClient.get('/system-configuration/data-types');
    return response.data.data;
  },

  async getConfigurationTypes(): Promise<string[]> {
    const response = await apiClient.get('/system-configuration/types');
    return response.data.data;
  },

  // Bulk Operations
  async bulkUpdateConfigurations(
    updates: Array<{
      key: string;
      environment: string;
      value: any;
    }>
  ) {
    const response = await apiClient.post('/system-configuration/bulk-update', {
      updates,
    });
    return response.data.data;
  },

  // Validation
  async validateConfigurations(
    configurations: Array<{
      key: string;
      name: string;
      description: string;
      value: any;
      dataType: string;
    }>
  ) {
    const response = await apiClient.post('/system-configuration/validate', {
      configurations,
    });
    return response.data.data;
  },

  // Feature Flag Utilities
  async toggleFeatureFlag(
    key: string,
    environment: string
  ): Promise<Configuration> {
    // Get current status first
    const currentFlag = await this.getFeatureFlags(environment);
    const flag = currentFlag.find((f) => f.key === key);

    if (!flag) {
      throw new Error('Feature flag not found');
    }

    return this.updateFeatureFlag(key, environment, { enabled: !flag.enabled });
  },

  async setRolloutPercentage(
    key: string,
    environment: string,
    percentage: number
  ): Promise<Configuration> {
    return this.updateFeatureFlag(key, environment, {
      rolloutPercentage: percentage,
    });
  },

  async addTargetUsers(
    key: string,
    environment: string,
    users: string[]
  ): Promise<Configuration> {
    const currentFlag = await this.getFeatureFlags(environment);
    const flag = currentFlag.find((f) => f.key === key);

    if (!flag) {
      throw new Error('Feature flag not found');
    }

    const existingUsers = flag.targetUsers || [];
    const newUsers = [...new Set([...existingUsers, ...users])];

    return this.updateFeatureFlag(key, environment, { targetUsers: newUsers });
  },

  async removeTargetUsers(
    key: string,
    environment: string,
    users: string[]
  ): Promise<Configuration> {
    const currentFlag = await this.getFeatureFlags(environment);
    const flag = currentFlag.find((f) => f.key === key);

    if (!flag) {
      throw new Error('Feature flag not found');
    }

    const existingUsers = flag.targetUsers || [];
    const filteredUsers = existingUsers.filter((user) => !users.includes(user));

    return this.updateFeatureFlag(key, environment, {
      targetUsers: filteredUsers,
    });
  },

  // System Setting Utilities
  async toggleBooleanSetting(
    key: string,
    environment: string
  ): Promise<Configuration> {
    const setting = await this.getSystemSetting(key, environment);

    if (typeof setting.value !== 'boolean') {
      throw new Error('Setting is not a boolean type');
    }

    return this.updateSystemSetting(key, environment, !setting.value);
  },

  async incrementNumericSetting(
    key: string,
    environment: string,
    increment: number = 1
  ): Promise<Configuration> {
    const setting = await this.getSystemSetting(key, environment);

    if (typeof setting.value !== 'number') {
      throw new Error('Setting is not a numeric type');
    }

    return this.updateSystemSetting(
      key,
      environment,
      setting.value + increment
    );
  },

  async appendToArraySetting(
    key: string,
    environment: string,
    items: any[]
  ): Promise<Configuration> {
    const setting = await this.getSystemSetting(key, environment);

    if (!Array.isArray(setting.value)) {
      throw new Error('Setting is not an array type');
    }

    const newArray = [...setting.value, ...items];
    return this.updateSystemSetting(key, environment, newArray);
  },

  async removeFromArraySetting(
    key: string,
    environment: string,
    items: any[]
  ): Promise<Configuration> {
    const setting = await this.getSystemSetting(key, environment);

    if (!Array.isArray(setting.value)) {
      throw new Error('Setting is not an array type');
    }

    const filteredArray = setting.value.filter((item) => !items.includes(item));
    return this.updateSystemSetting(key, environment, filteredArray);
  },

  async updateObjectProperty(
    key: string,
    environment: string,
    property: string,
    value: any
  ): Promise<Configuration> {
    const setting = await this.getSystemSetting(key, environment);

    if (typeof setting.value !== 'object' || Array.isArray(setting.value)) {
      throw new Error('Setting is not an object type');
    }

    const updatedObject = { ...setting.value, [property]: value };
    return this.updateSystemSetting(key, environment, updatedObject);
  },
};
