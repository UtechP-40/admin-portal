import apiClient from './api';

export interface TargetingRule {
  id: string;
  name: string;
  conditions: {
    attribute: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'regex';
    value: any;
  }[];
  rolloutPercentage: number;
  enabled: boolean;
}

export interface ABTestVariant {
  id: string;
  name: string;
  key: string;
  rolloutPercentage: number;
  configuration?: Record<string, any>;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  featureFlagKey: string;
  variants: ABTestVariant[];
  trafficAllocation: number;
  startDate?: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed';
  metrics: {
    conversionGoals: string[];
    primaryMetric: string;
    minimumDetectableEffect: number;
    statisticalPower: number;
  };
}

export interface FeatureFlagImpact {
  featureFlagKey: string;
  environment: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    totalUsers: number;
    enabledUsers: number;
    conversionRate: number;
    errorRate: number;
    performanceImpact: number;
  };
  events: {
    timestamp: Date;
    type: 'enabled' | 'disabled' | 'rollout_changed' | 'error';
    details: Record<string, any>;
  }[];
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environments: string[];
  rolloutPercentage?: number;
  targetUsers?: string[];
  conditions?: Record<string, any>;
  targetingRules?: TargetingRule[];
  abTest?: ABTest;
  tags?: string[];
  owner?: string;
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message?: string;
  customValidator?: string;
}

export interface SettingDependency {
  dependsOn: string;
  condition: {
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: any;
  };
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require';
}

export interface SettingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  settings: Array<{
    key: string;
    name: string;
    description: string;
    value: any;
    dataType: string;
    validationRules?: ValidationRule[];
    dependencies?: SettingDependency[];
  }>;
  tags?: string[];
}

export interface SettingHistory {
  id: string;
  settingKey: string;
  environment: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  version: number;
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
  validationRules?: ValidationRule[];
  dependencies?: SettingDependency[];
  tags?: string[];
  version?: number;
  lastModified?: Date;
  modifiedBy?: string;
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
    const newUsers = Array.from(new Set([...existingUsers, ...users]));

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

  // Advanced Feature Flag Management
  async createTargetingRule(
    featureFlagKey: string,
    environment: string,
    rule: Omit<TargetingRule, 'id'>
  ): Promise<TargetingRule> {
    const response = await apiClient.post(
      `/system-configuration/feature-flags/${featureFlagKey}/targeting-rules`,
      { environment, ...rule }
    );
    return response.data.data;
  },

  async updateTargetingRule(
    featureFlagKey: string,
    ruleId: string,
    environment: string,
    updates: Partial<TargetingRule>
  ): Promise<TargetingRule> {
    const response = await apiClient.put(
      `/system-configuration/feature-flags/${featureFlagKey}/targeting-rules/${ruleId}`,
      { environment, ...updates }
    );
    return response.data.data;
  },

  async deleteTargetingRule(
    featureFlagKey: string,
    ruleId: string,
    environment: string
  ): Promise<void> {
    await apiClient.delete(
      `/system-configuration/feature-flags/${featureFlagKey}/targeting-rules/${ruleId}`,
      { params: { environment } }
    );
  },

  async getTargetingRules(
    featureFlagKey: string,
    environment: string
  ): Promise<TargetingRule[]> {
    const response = await apiClient.get(
      `/system-configuration/feature-flags/${featureFlagKey}/targeting-rules`,
      { params: { environment } }
    );
    return response.data.data;
  },

  // A/B Testing
  async createABTest(
    featureFlagKey: string,
    environment: string,
    abTest: Omit<ABTest, 'id'>
  ): Promise<ABTest> {
    const response = await apiClient.post(
      `/system-configuration/feature-flags/${featureFlagKey}/ab-tests`,
      { environment, ...abTest }
    );
    return response.data.data;
  },

  async updateABTest(
    featureFlagKey: string,
    abTestId: string,
    environment: string,
    updates: Partial<ABTest>
  ): Promise<ABTest> {
    const response = await apiClient.put(
      `/system-configuration/feature-flags/${featureFlagKey}/ab-tests/${abTestId}`,
      { environment, ...updates }
    );
    return response.data.data;
  },

  async getABTest(
    featureFlagKey: string,
    abTestId: string,
    environment: string
  ): Promise<ABTest> {
    const response = await apiClient.get(
      `/system-configuration/feature-flags/${featureFlagKey}/ab-tests/${abTestId}`,
      { params: { environment } }
    );
    return response.data.data;
  },

  async getABTests(
    featureFlagKey?: string,
    environment?: string
  ): Promise<ABTest[]> {
    const response = await apiClient.get('/system-configuration/ab-tests', {
      params: { featureFlagKey, environment }
    });
    return response.data.data;
  },

  async startABTest(
    featureFlagKey: string,
    abTestId: string,
    environment: string
  ): Promise<ABTest> {
    const response = await apiClient.post(
      `/system-configuration/feature-flags/${featureFlagKey}/ab-tests/${abTestId}/start`,
      { environment }
    );
    return response.data.data;
  },

  async pauseABTest(
    featureFlagKey: string,
    abTestId: string,
    environment: string
  ): Promise<ABTest> {
    const response = await apiClient.post(
      `/system-configuration/feature-flags/${featureFlagKey}/ab-tests/${abTestId}/pause`,
      { environment }
    );
    return response.data.data;
  },

  async completeABTest(
    featureFlagKey: string,
    abTestId: string,
    environment: string,
    winningVariantId?: string
  ): Promise<ABTest> {
    const response = await apiClient.post(
      `/system-configuration/feature-flags/${featureFlagKey}/ab-tests/${abTestId}/complete`,
      { environment, winningVariantId }
    );
    return response.data.data;
  },

  async getABTestResults(
    featureFlagKey: string,
    abTestId: string,
    environment: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<{
    variants: Array<{
      variantId: string;
      name: string;
      users: number;
      conversions: number;
      conversionRate: number;
      confidence: number;
      significance: number;
    }>;
    summary: {
      totalUsers: number;
      totalConversions: number;
      winningVariant?: string;
      statisticalSignificance: boolean;
    };
  }> {
    const response = await apiClient.get(
      `/system-configuration/feature-flags/${featureFlagKey}/ab-tests/${abTestId}/results`,
      { params: { environment, ...dateRange } }
    );
    return response.data.data;
  },

  // Feature Flag Impact Tracking
  async getFeatureFlagImpact(
    featureFlagKey: string,
    environment: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<FeatureFlagImpact> {
    const response = await apiClient.get(
      `/system-configuration/feature-flags/${featureFlagKey}/impact`,
      { params: { environment, ...dateRange } }
    );
    return response.data.data;
  },

  async getFeatureFlagHistory(
    featureFlagKey: string,
    environment: string,
    limit?: number
  ): Promise<Array<{
    timestamp: Date;
    action: string;
    user: string;
    changes: Record<string, any>;
    version: number;
  }>> {
    const response = await apiClient.get(
      `/system-configuration/feature-flags/${featureFlagKey}/history`,
      { params: { environment, limit } }
    );
    return response.data.data;
  },

  async rollbackFeatureFlag(
    featureFlagKey: string,
    environment: string,
    version: number
  ): Promise<FeatureFlag> {
    const response = await apiClient.post(
      `/system-configuration/feature-flags/${featureFlagKey}/rollback`,
      { environment, version }
    );
    return response.data.data;
  },

  async getFeatureFlagMetrics(
    featureFlagKey: string,
    environment: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<{
    usage: {
      totalEvaluations: number;
      uniqueUsers: number;
      enabledEvaluations: number;
      disabledEvaluations: number;
    };
    performance: {
      averageLatency: number;
      errorRate: number;
      cacheHitRate: number;
    };
    trends: Array<{
      date: Date;
      evaluations: number;
      uniqueUsers: number;
      errorRate: number;
    }>;
  }> {
    const response = await apiClient.get(
      `/system-configuration/feature-flags/${featureFlagKey}/metrics`,
      { params: { environment, ...dateRange } }
    );
    return response.data.data;
  },

  // Bulk Feature Flag Operations
  async bulkToggleFeatureFlags(
    operations: Array<{
      key: string;
      environment: string;
      enabled: boolean;
    }>
  ): Promise<void> {
    await apiClient.post('/system-configuration/feature-flags/bulk-toggle', {
      operations
    });
  },

  async bulkUpdateRollout(
    operations: Array<{
      key: string;
      environment: string;
      rolloutPercentage: number;
    }>
  ): Promise<void> {
    await apiClient.post('/system-configuration/feature-flags/bulk-rollout', {
      operations
    });
  },

  // Feature Flag Templates
  async getFeatureFlagTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    template: Partial<FeatureFlag>;
  }>> {
    const response = await apiClient.get('/system-configuration/feature-flag-templates');
    return response.data.data;
  },

  async createFeatureFlagFromTemplate(
    templateId: string,
    overrides: Partial<CreateFeatureFlagData>
  ): Promise<Configuration> {
    const response = await apiClient.post(
      `/system-configuration/feature-flag-templates/${templateId}/create`,
      overrides
    );
    return response.data.data;
  },

  // Enhanced System Settings Management
  async validateSystemSetting(
    key: string,
    value: any,
    environment: string
  ): Promise<{
    isValid: boolean;
    errors: Array<{
      rule: string;
      message: string;
    }>;
  }> {
    const response = await apiClient.post(
      `/system-configuration/system-settings/${key}/validate`,
      { value, environment }
    );
    return response.data.data;
  },

  async getSystemSettingHistory(
    key: string,
    environment: string,
    limit?: number
  ): Promise<SettingHistory[]> {
    const response = await apiClient.get(
      `/system-configuration/system-settings/${key}/history`,
      { params: { environment, limit } }
    );
    return response.data.data;
  },

  async rollbackSystemSetting(
    key: string,
    environment: string,
    version: number,
    reason?: string
  ): Promise<SystemSetting> {
    const response = await apiClient.post(
      `/system-configuration/system-settings/${key}/rollback`,
      { environment, version, reason }
    );
    return response.data.data;
  },

  async getSettingDependencies(
    key: string,
    environment: string
  ): Promise<{
    dependsOn: SystemSetting[];
    dependents: SystemSetting[];
  }> {
    const response = await apiClient.get(
      `/system-configuration/system-settings/${key}/dependencies`,
      { params: { environment } }
    );
    return response.data.data;
  },

  async validateSettingDependencies(
    settings: Array<{
      key: string;
      value: any;
      environment: string;
    }>
  ): Promise<{
    isValid: boolean;
    conflicts: Array<{
      settingKey: string;
      dependencyKey: string;
      message: string;
    }>;
  }> {
    const response = await apiClient.post(
      '/system-configuration/system-settings/validate-dependencies',
      { settings }
    );
    return response.data.data;
  },

  // Setting Templates
  async getSettingTemplates(category?: string): Promise<SettingTemplate[]> {
    const response = await apiClient.get('/system-configuration/setting-templates', {
      params: { category }
    });
    return response.data.data;
  },

  async createSettingTemplate(template: Omit<SettingTemplate, 'id'>): Promise<SettingTemplate> {
    const response = await apiClient.post('/system-configuration/setting-templates', template);
    return response.data.data;
  },

  async updateSettingTemplate(
    templateId: string,
    updates: Partial<SettingTemplate>
  ): Promise<SettingTemplate> {
    const response = await apiClient.put(
      `/system-configuration/setting-templates/${templateId}`,
      updates
    );
    return response.data.data;
  },

  async deleteSettingTemplate(templateId: string): Promise<void> {
    await apiClient.delete(`/system-configuration/setting-templates/${templateId}`);
  },

  async applySettingTemplate(
    templateId: string,
    environment: string,
    overrides?: Record<string, any>
  ): Promise<SystemSetting[]> {
    const response = await apiClient.post(
      `/system-configuration/setting-templates/${templateId}/apply`,
      { environment, overrides }
    );
    return response.data.data;
  },

  // Bulk System Settings Operations
  async bulkUpdateSystemSettings(
    updates: Array<{
      key: string;
      environment: string;
      value: any;
      reason?: string;
    }>
  ): Promise<{
    successful: SystemSetting[];
    failed: Array<{
      key: string;
      error: string;
    }>;
  }> {
    const response = await apiClient.post('/system-configuration/system-settings/bulk-update', {
      updates
    });
    return response.data.data;
  },

  async bulkValidateSystemSettings(
    settings: Array<{
      key: string;
      value: any;
      environment: string;
    }>
  ): Promise<Array<{
    key: string;
    isValid: boolean;
    errors: Array<{
      rule: string;
      message: string;
    }>;
  }>> {
    const response = await apiClient.post('/system-configuration/system-settings/bulk-validate', {
      settings
    });
    return response.data.data;
  },

  async exportSystemSettings(
    environment: string,
    category?: string,
    format: 'json' | 'yaml' | 'env' = 'json'
  ): Promise<Blob> {
    const response = await apiClient.get('/system-configuration/system-settings/export', {
      params: { environment, category, format },
      responseType: 'blob'
    });
    return response.data;
  },

  async importSystemSettings(
    file: File,
    environment: string,
    options?: {
      overwrite?: boolean;
      validateOnly?: boolean;
      skipDependencyCheck?: boolean;
    }
  ): Promise<{
    imported: SystemSetting[];
    skipped: Array<{
      key: string;
      reason: string;
    }>;
    errors: Array<{
      key: string;
      error: string;
    }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('environment', environment);
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    const response = await apiClient.post('/system-configuration/system-settings/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Setting Change Management
  async createSettingChangeRequest(
    changes: Array<{
      key: string;
      environment: string;
      newValue: any;
      reason: string;
    }>,
    metadata?: {
      title: string;
      description: string;
      scheduledFor?: Date;
    }
  ): Promise<{
    requestId: string;
    status: 'pending' | 'approved' | 'rejected';
    changes: Array<{
      key: string;
      environment: string;
      currentValue: any;
      newValue: any;
      reason: string;
    }>;
  }> {
    const response = await apiClient.post('/system-configuration/change-requests', {
      changes,
      metadata
    });
    return response.data.data;
  },

  async getSettingChangeRequests(
    status?: 'pending' | 'approved' | 'rejected' | 'applied'
  ): Promise<Array<{
    requestId: string;
    status: string;
    createdBy: string;
    createdAt: Date;
    metadata: any;
    changes: any[];
  }>> {
    const response = await apiClient.get('/system-configuration/change-requests', {
      params: { status }
    });
    return response.data.data;
  },

  async approveSettingChangeRequest(
    requestId: string,
    comment?: string
  ): Promise<void> {
    await apiClient.post(`/system-configuration/change-requests/${requestId}/approve`, {
      comment
    });
  },

  async rejectSettingChangeRequest(
    requestId: string,
    reason: string
  ): Promise<void> {
    await apiClient.post(`/system-configuration/change-requests/${requestId}/reject`, {
      reason
    });
  },

  async applySettingChangeRequest(requestId: string): Promise<{
    applied: SystemSetting[];
    failed: Array<{
      key: string;
      error: string;
    }>;
  }> {
    const response = await apiClient.post(`/system-configuration/change-requests/${requestId}/apply`);
    return response.data.data;
  },

  // Environment Synchronization
  async compareEnvironments(
    sourceEnvironment: string,
    targetEnvironment: string,
    configType?: 'feature-flags' | 'system-settings' | 'all'
  ): Promise<{
    differences: Array<{
      key: string;
      type: 'feature-flag' | 'system-setting';
      status: 'added' | 'modified' | 'deleted';
      sourceValue: any;
      targetValue: any;
      conflictLevel: 'low' | 'medium' | 'high';
      dependencies: string[];
    }>;
    summary: {
      totalDifferences: number;
      added: number;
      modified: number;
      deleted: number;
      conflicts: number;
    };
  }> {
    const response = await apiClient.get('/system-configuration/environments/compare', {
      params: { sourceEnvironment, targetEnvironment, configType }
    });
    return response.data.data;
  },

  async syncEnvironments(
    sourceEnvironment: string,
    targetEnvironment: string,
    options: {
      configType?: 'feature-flags' | 'system-settings' | 'all';
      selectedKeys?: string[];
      conflictResolution?: 'source' | 'target' | 'manual';
      createBackup?: boolean;
      dryRun?: boolean;
    }
  ): Promise<{
    syncId: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    results: {
      synced: Array<{
        key: string;
        type: string;
        action: 'created' | 'updated' | 'deleted';
      }>;
      skipped: Array<{
        key: string;
        reason: string;
      }>;
      failed: Array<{
        key: string;
        error: string;
      }>;
    };
    backupId?: string;
  }> {
    const response = await apiClient.post('/system-configuration/environments/sync', {
      sourceEnvironment,
      targetEnvironment,
      ...options
    });
    return response.data.data;
  },

  async getSyncStatus(syncId: string): Promise<{
    syncId: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    progress: number;
    currentStep: string;
    results?: any;
    error?: string;
  }> {
    const response = await apiClient.get(`/system-configuration/sync/${syncId}/status`);
    return response.data.data;
  },

  async cancelSync(syncId: string): Promise<void> {
    await apiClient.post(`/system-configuration/sync/${syncId}/cancel`);
  },

  // Configuration Backup and Restore
  async createBackup(
    environment: string,
    options?: {
      name?: string;
      description?: string;
      configType?: 'feature-flags' | 'system-settings' | 'all';
      includeHistory?: boolean;
    }
  ): Promise<{
    backupId: string;
    name: string;
    environment: string;
    createdAt: Date;
    size: number;
    configCount: number;
  }> {
    const response = await apiClient.post('/system-configuration/backups', {
      environment,
      ...options
    });
    return response.data.data;
  },

  async getBackups(environment?: string): Promise<Array<{
    backupId: string;
    name: string;
    environment: string;
    createdAt: Date;
    size: number;
    configCount: number;
    description?: string;
  }>> {
    const response = await apiClient.get('/system-configuration/backups', {
      params: { environment }
    });
    return response.data.data;
  },

  async restoreBackup(
    backupId: string,
    targetEnvironment: string,
    options?: {
      configType?: 'feature-flags' | 'system-settings' | 'all';
      selectedKeys?: string[];
      overwriteExisting?: boolean;
      createBackupBeforeRestore?: boolean;
    }
  ): Promise<{
    restoreId: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    results: {
      restored: Array<{
        key: string;
        type: string;
      }>;
      skipped: Array<{
        key: string;
        reason: string;
      }>;
      failed: Array<{
        key: string;
        error: string;
      }>;
    };
    preRestoreBackupId?: string;
  }> {
    const response = await apiClient.post(`/system-configuration/backups/${backupId}/restore`, {
      targetEnvironment,
      ...options
    });
    return response.data.data;
  },

  async deleteBackup(backupId: string): Promise<void> {
    await apiClient.delete(`/system-configuration/backups/${backupId}`);
  },

  async downloadBackup(backupId: string): Promise<Blob> {
    const response = await apiClient.get(`/system-configuration/backups/${backupId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Automated Sync Schedules
  async createSyncSchedule(schedule: {
    name: string;
    description?: string;
    sourceEnvironment: string;
    targetEnvironment: string;
    configType: 'feature-flags' | 'system-settings' | 'all';
    cronExpression: string;
    enabled: boolean;
    options: {
      conflictResolution: 'source' | 'target' | 'skip';
      createBackup: boolean;
      notifyOnFailure: boolean;
      notificationEmails?: string[];
    };
  }): Promise<{
    scheduleId: string;
    nextRun: Date;
  }> {
    const response = await apiClient.post('/system-configuration/sync-schedules', schedule);
    return response.data.data;
  },

  async getSyncSchedules(): Promise<Array<{
    scheduleId: string;
    name: string;
    description?: string;
    sourceEnvironment: string;
    targetEnvironment: string;
    configType: string;
    cronExpression: string;
    enabled: boolean;
    nextRun: Date;
    lastRun?: Date;
    lastRunStatus?: 'success' | 'failed';
  }>> {
    const response = await apiClient.get('/system-configuration/sync-schedules');
    return response.data.data;
  },

  async updateSyncSchedule(
    scheduleId: string,
    updates: Partial<{
      name: string;
      description: string;
      cronExpression: string;
      enabled: boolean;
      options: any;
    }>
  ): Promise<void> {
    await apiClient.put(`/system-configuration/sync-schedules/${scheduleId}`, updates);
  },

  async deleteSyncSchedule(scheduleId: string): Promise<void> {
    await apiClient.delete(`/system-configuration/sync-schedules/${scheduleId}`);
  },

  async triggerSyncSchedule(scheduleId: string): Promise<{
    syncId: string;
  }> {
    const response = await apiClient.post(`/system-configuration/sync-schedules/${scheduleId}/trigger`);
    return response.data.data;
  },

  // Configuration Drift Detection
  async detectConfigurationDrift(
    baselineEnvironment: string,
    compareEnvironments: string[],
    configType?: 'feature-flags' | 'system-settings' | 'all'
  ): Promise<{
    driftReport: {
      environment: string;
      driftScore: number;
      differences: Array<{
        key: string;
        type: string;
        driftType: 'value' | 'missing' | 'extra';
        severity: 'low' | 'medium' | 'high';
        baselineValue: any;
        currentValue: unknown;
      }>;
    }[];
    summary: {
      totalEnvironments: number;
      environmentsWithDrift: number;
      averageDriftScore: number;
      highSeverityDrifts: number;
    };
  }> {
    const response = await apiClient.post('/system-configuration/drift-detection', {
      baselineEnvironment,
      compareEnvironments,
      configType
    });
    return response.data.data;
  },

  async createDriftAlert(alert: {
    name: string;
    description?: string;
    baselineEnvironment: string;
    monitoredEnvironments: string[];
    configType: 'feature-flags' | 'system-settings' | 'all';
    thresholds: {
      driftScore: number;
      highSeverityCount: number;
    };
    schedule: string; // cron expression
    enabled: boolean;
    notifications: {
      email?: string[];
      webhook?: string;
    };
  }): Promise<{
    alertId: string;
  }> {
    const response = await apiClient.post('/system-configuration/drift-alerts', alert);
    return response.data.data;
  },

  async getDriftAlerts(): Promise<Array<{
    alertId: string;
    name: string;
    description?: string;
    baselineEnvironment: string;
    monitoredEnvironments: string[];
    configType: string;
    enabled: boolean;
    lastRun?: Date;
    lastRunStatus?: 'success' | 'failed';
    nextRun: Date;
  }>> {
    const response = await apiClient.get('/system-configuration/drift-alerts');
    return response.data.data;
  },
};
