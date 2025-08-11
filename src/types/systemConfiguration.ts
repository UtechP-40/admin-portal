// System Configuration Types
// Extracted to avoid module resolution issues

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