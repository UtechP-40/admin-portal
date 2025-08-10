export interface MultiFactorAuthSettings {
  enabled: boolean;
  requiredForAllUsers: boolean;
  methods: MFAMethod[];
  backupCodes: {
    enabled: boolean;
    count: number;
  };
  trustedDevices: {
    enabled: boolean;
    trustDuration: number; // days
  };
  gracePeriod: number; // hours
}

export enum MFAMethod {
  TOTP = 'totp', // Time-based One-Time Password (Google Authenticator, etc.)
  SMS = 'sms',
  EMAIL = 'email',
  HARDWARE_TOKEN = 'hardware_token',
  BIOMETRIC = 'biometric',
  BACKUP_CODES = 'backup_codes'
}

export interface MFADevice {
  id: string;
  userId: string;
  username: string;
  deviceName: string;
  method: MFAMethod;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  metadata?: {
    phoneNumber?: string;
    email?: string;
    deviceInfo?: string;
    publicKey?: string;
  };
}

export interface IPRestrictionSettings {
  enabled: boolean;
  mode: 'whitelist' | 'blacklist';
  whitelist: IPRestriction[];
  blacklist: IPRestriction[];
  geolocationBlocking: {
    enabled: boolean;
    blockedCountries: string[];
    blockedRegions: string[];
    allowVPN: boolean;
  };
  rateLimit: {
    enabled: boolean;
    maxAttempts: number;
    windowMinutes: number;
    blockDuration: number; // minutes
  };
}

export interface IPRestriction {
  id: string;
  ipAddress: string; // Can be single IP or CIDR notation
  description: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface SessionSettings {
  maxConcurrentSessions: number;
  sessionTimeout: number; // minutes
  idleTimeout: number; // minutes
  rememberMeEnabled: boolean;
  rememberMeDuration: number; // days
  forceLogoutOnPasswordChange: boolean;
  sessionSecurityLevel: SessionSecurityLevel;
  deviceTracking: {
    enabled: boolean;
    requireApprovalForNewDevices: boolean;
    deviceTrustDuration: number; // days
  };
}

export enum SessionSecurityLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  HIGH = 'high',
  MAXIMUM = 'maximum'
}

export interface UserSession {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
    isMobile: boolean;
  };
  location?: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
  isCurrent: boolean;
  mfaVerified: boolean;
  securityLevel: SessionSecurityLevel;
  metadata?: Record<string, any>;
}

export interface AccessAttempt {
  id: string;
  userId?: string;
  username?: string;
  ipAddress: string;
  userAgent: string;
  attemptType: AccessAttemptType;
  success: boolean;
  failureReason?: string;
  timestamp: Date;
  location?: {
    country: string;
    region: string;
    city: string;
  };
  mfaRequired: boolean;
  mfaCompleted: boolean;
  deviceTrusted: boolean;
  riskScore: number;
  blocked: boolean;
  blockReason?: string;
}

export enum AccessAttemptType {
  LOGIN = 'login',
  MFA_VERIFICATION = 'mfa_verification',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_UNLOCK = 'account_unlock',
  API_ACCESS = 'api_access'
}

export interface TrustedDevice {
  id: string;
  userId: string;
  username: string;
  deviceName: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
  };
  location?: {
    country: string;
    region: string;
    city: string;
  };
  trustedAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  trustLevel: 'low' | 'medium' | 'high';
}

export interface AccessControlPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: AccessCondition[];
  actions: AccessAction[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  appliedCount: number;
  lastAppliedAt?: Date;
}

export interface AccessCondition {
  type: ConditionType;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  field: string;
  value: any;
  caseSensitive?: boolean;
}

export enum ConditionType {
  USER_ROLE = 'user_role',
  USER_GROUP = 'user_group',
  IP_ADDRESS = 'ip_address',
  GEOLOCATION = 'geolocation',
  TIME_OF_DAY = 'time_of_day',
  DAY_OF_WEEK = 'day_of_week',
  DEVICE_TYPE = 'device_type',
  BROWSER = 'browser',
  MFA_STATUS = 'mfa_status',
  RISK_SCORE = 'risk_score',
  SESSION_COUNT = 'session_count'
}

export interface AccessAction {
  type: ActionType;
  parameters?: Record<string, any>;
}

export enum ActionType {
  ALLOW = 'allow',
  DENY = 'deny',
  REQUIRE_MFA = 'require_mfa',
  LIMIT_SESSIONS = 'limit_sessions',
  FORCE_PASSWORD_CHANGE = 'force_password_change',
  SEND_NOTIFICATION = 'send_notification',
  LOG_EVENT = 'log_event',
  QUARANTINE_USER = 'quarantine_user'
}

export interface AccessControlMetrics {
  totalSessions: number;
  activeSessions: number;
  failedLoginAttempts: number;
  successfulLogins: number;
  mfaVerifications: number;
  blockedAttempts: number;
  trustedDevices: number;
  suspiciousActivities: number;
  averageSessionDuration: number;
  topFailureReasons: Array<{
    reason: string;
    count: number;
  }>;
  loginsByLocation: Array<{
    country: string;
    count: number;
  }>;
  deviceTypes: Array<{
    type: string;
    count: number;
  }>;
}

export interface GeolocationInfo {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  organization: string;
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}