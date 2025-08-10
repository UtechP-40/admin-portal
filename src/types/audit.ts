// Audit event types
export enum AuditEventType {
  // Authentication events
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login_failed',
  SESSION_EXPIRED = 'auth.session_expired',
  PASSWORD_RESET_REQUESTED = 'auth.password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'auth.password_reset_completed',

  // User management events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_BANNED = 'user.banned',
  USER_UNBANNED = 'user.unbanned',
  USER_PERMISSIONS_CHANGED = 'user.permissions_changed',
  USER_ROLE_CHANGED = 'user.role_changed',

  // System configuration events
  CONFIG_UPDATED = 'config.updated',
  FEATURE_FLAG_TOGGLED = 'config.feature_flag_toggled',
  SYSTEM_SETTING_CHANGED = 'config.system_setting_changed',
  ENVIRONMENT_SYNC = 'config.environment_sync',

  // Database events
  DATABASE_QUERY = 'database.query',
  DATABASE_INSERT = 'database.insert',
  DATABASE_UPDATE = 'database.update',
  DATABASE_DELETE = 'database.delete',
  DATABASE_BULK_OPERATION = 'database.bulk_operation',
  DATABASE_EXPORT = 'database.export',

  // Security events
  UNAUTHORIZED_ACCESS = 'security.unauthorized_access',
  PERMISSION_DENIED = 'security.permission_denied',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  SECURITY_POLICY_VIOLATION = 'security.policy_violation',
  IP_BLOCKED = 'security.ip_blocked',

  // Game room events
  GAME_ROOM_ENDED = 'game.room_ended',
  PLAYER_KICKED = 'game.player_kicked',
  PLAYER_BANNED_FROM_ROOM = 'game.player_banned_from_room',
  MODERATION_ACTION = 'game.moderation_action',

  // System events
  SYSTEM_ERROR = 'system.error',
  API_ERROR = 'system.api_error',
  PERFORMANCE_ALERT = 'system.performance_alert',
  BACKUP_CREATED = 'system.backup_created',
  BACKUP_RESTORED = 'system.backup_restored',

  // Testing events
  API_TEST_EXECUTED = 'testing.api_test_executed',
  LOAD_TEST_STARTED = 'testing.load_test_started',
  LOAD_TEST_COMPLETED = 'testing.load_test_completed',
}

// Audit event severity levels
export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Audit event categories
export enum AuditCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  USER_MANAGEMENT = 'user_management',
  SYSTEM_CONFIGURATION = 'system_configuration',
  DATABASE = 'database',
  SECURITY = 'security',
  GAME_MANAGEMENT = 'game_management',
  SYSTEM = 'system',
  TESTING = 'testing',
}

// Base audit event interface
export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  category: AuditCategory;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  duration?: number;
  tags?: string[];
}

// Audit log query parameters
export interface AuditLogQuery {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  categories?: AuditCategory[];
  severities?: AuditSeverity[];
  userId?: string;
  userEmail?: string;
  resource?: string;
  success?: boolean;
  search?: string;
  sortBy?: 'timestamp' | 'severity' | 'eventType';
  sortOrder?: 'asc' | 'desc';
}

// Audit log response
export interface AuditLogResponse {
  events: AuditEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Audit statistics
export interface AuditStatistics {
  totalEvents: number;
  eventsByCategory: Record<AuditCategory, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  topUsers: Array<{
    userId: string;
    userEmail: string;
    eventCount: number;
  }>;
  topEventTypes: Array<{
    eventType: AuditEventType;
    count: number;
  }>;
  securityEvents: number;
  failedLogins: number;
  suspiciousActivities: number;
}

// Audit alert configuration
export interface AuditAlert {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    eventTypes?: AuditEventType[];
    categories?: AuditCategory[];
    severities?: AuditSeverity[];
    threshold?: number;
    timeWindow?: number; // in minutes
    userPattern?: string;
    resourcePattern?: string;
  };
  actions: {
    email?: {
      enabled: boolean;
      recipients: string[];
    };
    webhook?: {
      enabled: boolean;
      url: string;
      headers?: Record<string, string>;
    };
    notification?: {
      enabled: boolean;
      channels: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

// Audit export options
export interface AuditExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  query: AuditLogQuery;
  includeMetadata: boolean;
  includeUserDetails: boolean;
  compression?: 'gzip' | 'zip';
}

// Audit retention policy
export interface AuditRetentionPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  retentionPeriod: number; // in days
  categories?: AuditCategory[];
  severities?: AuditSeverity[];
  archiveBeforeDelete: boolean;
  archiveLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}