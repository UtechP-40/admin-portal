export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: SecurityEventType;
  severity: SecuritySeverity;
  source: string;
  sourceIp: string;
  userAgent?: string;
  userId?: string;
  username?: string;
  description: string;
  metadata?: Record<string, any>;
  status: SecurityEventStatus;
  riskScore: number;
  geolocation?: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

export enum SecurityEventType {
  FAILED_LOGIN = 'failed_login',
  SUCCESSFUL_LOGIN = 'successful_login',
  SUSPICIOUS_LOGIN = 'suspicious_login',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  MALICIOUS_REQUEST = 'malicious_request',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  IP_BLOCKED = 'ip_blocked',
  ACCOUNT_LOCKED = 'account_locked',
  PASSWORD_POLICY_VIOLATION = 'password_policy_violation',
  SESSION_HIJACK_ATTEMPT = 'session_hijack_attempt',
  ANOMALOUS_BEHAVIOR = 'anomalous_behavior',
  CONFIGURATION_CHANGE = 'configuration_change',
  ADMIN_ACTION = 'admin_action',
  SYSTEM_COMPROMISE = 'system_compromise'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum SecurityEventStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  IGNORED = 'ignored'
}

export interface SecurityThreat {
  id: string;
  name: string;
  description: string;
  severity: SecuritySeverity;
  category: ThreatCategory;
  indicators: string[];
  mitigationSteps: string[];
  affectedSystems: string[];
  firstDetected: Date;
  lastDetected: Date;
  eventCount: number;
  status: ThreatStatus;
  riskScore: number;
}

export enum ThreatCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_PROTECTION = 'data_protection',
  NETWORK_SECURITY = 'network_security',
  APPLICATION_SECURITY = 'application_security',
  SYSTEM_INTEGRITY = 'system_integrity',
  COMPLIANCE = 'compliance'
}

export enum ThreatStatus {
  ACTIVE = 'active',
  MITIGATED = 'mitigated',
  MONITORING = 'monitoring',
  RESOLVED = 'resolved'
}

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  mediumSeverityEvents: number;
  lowSeverityEvents: number;
  failedLogins: number;
  successfulLogins: number;
  blockedIps: number;
  activeThreat: number;
  resolvedThreats: number;
  averageRiskScore: number;
  topThreats: SecurityThreat[];
  recentEvents: SecurityEvent[];
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  eventsOverTime: Array<{
    timestamp: Date;
    count: number;
    severity: SecuritySeverity;
  }>;
}

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: SecuritySeverity;
  type: SecurityAlertType;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  triggeredAt?: Date;
  resolvedAt?: Date;
  conditions: SecurityAlertCondition[];
  actions: SecurityAlertAction[];
  metadata?: Record<string, any>;
}

export enum SecurityAlertType {
  THRESHOLD = 'threshold',
  ANOMALY = 'anomaly',
  PATTERN = 'pattern',
  CORRELATION = 'correlation'
}

export interface SecurityAlertCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'contains' | 'regex';
  value: any;
  timeWindow?: number; // in minutes
}

export interface SecurityAlertAction {
  type: 'email' | 'webhook' | 'block_ip' | 'lock_account' | 'log';
  config: Record<string, any>;
}

export interface SecurityDashboardData {
  metrics: SecurityMetrics;
  alerts: SecurityAlert[];
  threats: SecurityThreat[];
  riskAssessment: RiskAssessment;
}

export interface RiskAssessment {
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  recommendations: string[];
  lastUpdated: Date;
}

export interface RiskFactor {
  category: string;
  description: string;
  impact: number; // 1-10 scale
  likelihood: number; // 1-10 scale
  riskScore: number;
  mitigationStatus: 'none' | 'partial' | 'complete';
}

export interface SecurityConfiguration {
  alertThresholds: {
    failedLoginAttempts: number;
    suspiciousActivityScore: number;
    rateLimit: number;
    bruteForceWindow: number; // minutes
  };
  ipBlocking: {
    enabled: boolean;
    autoBlockThreshold: number;
    blockDuration: number; // minutes
    whitelist: string[];
    blacklist: string[];
  };
  monitoring: {
    realTimeEnabled: boolean;
    logRetentionDays: number;
    anomalyDetectionEnabled: boolean;
    correlationRulesEnabled: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    webhookEnabled: boolean;
    slackEnabled: boolean;
    recipients: string[];
  };
}

export interface IntrusionDetectionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: SecuritySeverity;
  conditions: SecurityAlertCondition[];
  actions: SecurityAlertAction[];
  createdAt: Date;
  updatedAt: Date;
  triggeredCount: number;
  lastTriggered?: Date;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  username: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  riskScore: number;
  metadata?: Record<string, any>;
}