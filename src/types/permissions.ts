// Permission definitions
export enum Permission {
  // User Management
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  USER_BAN = 'user:ban',
  USER_PERMISSIONS = 'user:permissions',

  // System Configuration
  CONFIG_VIEW = 'config:view',
  CONFIG_EDIT = 'config:edit',
  CONFIG_FEATURE_FLAGS = 'config:feature-flags',
  CONFIG_SYSTEM_SETTINGS = 'config:system-settings',
  CONFIG_ENVIRONMENT_SYNC = 'config:environment-sync',

  // Analytics and Monitoring
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  ANALYTICS_REPORTS = 'analytics:reports',
  MONITORING_VIEW = 'monitoring:view',
  MONITORING_LOGS = 'monitoring:logs',
  MONITORING_ALERTS = 'monitoring:alerts',

  // Database Management
  DATABASE_VIEW = 'database:view',
  DATABASE_EDIT = 'database:edit',
  DATABASE_DELETE = 'database:delete',
  DATABASE_BULK_OPS = 'database:bulk-operations',
  DATABASE_EXPORT = 'database:export',

  // Testing Tools
  TESTING_API = 'testing:api',
  TESTING_SOCKET = 'testing:socket',
  TESTING_LOAD = 'testing:load',

  // Game Room Monitoring
  GAME_ROOMS_VIEW = 'game-rooms:view',
  GAME_ROOMS_MANAGE = 'game-rooms:manage',
  GAME_ROOMS_MODERATE = 'game-rooms:moderate',

  // Security and Audit
  SECURITY_VIEW = 'security:view',
  SECURITY_MANAGE = 'security:manage',
  AUDIT_VIEW = 'audit:view',
  AUDIT_EXPORT = 'audit:export',

  // System Administration
  ADMIN_USERS = 'admin:users',
  ADMIN_ROLES = 'admin:roles',
  ADMIN_SYSTEM = 'admin:system',
}

// Role definitions
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  ANALYST = 'analyst',
  SUPPORT = 'support',
  VIEWER = 'viewer',
}

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission), // All permissions

  [Role.ADMIN]: [
    // User Management
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_EDIT,
    Permission.USER_DELETE,
    Permission.USER_BAN,
    Permission.USER_PERMISSIONS,

    // System Configuration
    Permission.CONFIG_VIEW,
    Permission.CONFIG_EDIT,
    Permission.CONFIG_FEATURE_FLAGS,
    Permission.CONFIG_SYSTEM_SETTINGS,
    Permission.CONFIG_ENVIRONMENT_SYNC,

    // Analytics and Monitoring
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.ANALYTICS_REPORTS,
    Permission.MONITORING_VIEW,
    Permission.MONITORING_LOGS,
    Permission.MONITORING_ALERTS,

    // Database Management
    Permission.DATABASE_VIEW,
    Permission.DATABASE_EDIT,
    Permission.DATABASE_DELETE,
    Permission.DATABASE_BULK_OPS,
    Permission.DATABASE_EXPORT,

    // Testing Tools
    Permission.TESTING_API,
    Permission.TESTING_SOCKET,
    Permission.TESTING_LOAD,

    // Game Room Monitoring
    Permission.GAME_ROOMS_VIEW,
    Permission.GAME_ROOMS_MANAGE,
    Permission.GAME_ROOMS_MODERATE,

    // Security and Audit
    Permission.SECURITY_VIEW,
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,
  ],

  [Role.MODERATOR]: [
    // User Management (limited)
    Permission.USER_VIEW,
    Permission.USER_BAN,

    // Analytics (view only)
    Permission.ANALYTICS_VIEW,
    Permission.MONITORING_VIEW,

    // Game Room Monitoring
    Permission.GAME_ROOMS_VIEW,
    Permission.GAME_ROOMS_MANAGE,
    Permission.GAME_ROOMS_MODERATE,

    // Security (view only)
    Permission.SECURITY_VIEW,
    Permission.AUDIT_VIEW,
  ],

  [Role.ANALYST]: [
    // Analytics and Monitoring
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.ANALYTICS_REPORTS,
    Permission.MONITORING_VIEW,
    Permission.MONITORING_LOGS,

    // Database (view only)
    Permission.DATABASE_VIEW,
    Permission.DATABASE_EXPORT,

    // Game Room Monitoring (view only)
    Permission.GAME_ROOMS_VIEW,

    // Audit (view only)
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,
  ],

  [Role.SUPPORT]: [
    // User Management (limited)
    Permission.USER_VIEW,

    // Analytics (view only)
    Permission.ANALYTICS_VIEW,
    Permission.MONITORING_VIEW,
    Permission.MONITORING_LOGS,

    // Game Room Monitoring (view only)
    Permission.GAME_ROOMS_VIEW,

    // Testing Tools
    Permission.TESTING_API,
    Permission.TESTING_SOCKET,
  ],

  [Role.VIEWER]: [
    // Basic view permissions only
    Permission.USER_VIEW,
    Permission.CONFIG_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.MONITORING_VIEW,
    Permission.DATABASE_VIEW,
    Permission.GAME_ROOMS_VIEW,
    Permission.SECURITY_VIEW,
    Permission.AUDIT_VIEW,
  ],
};

// Permission groups for UI organization
export const PERMISSION_GROUPS = {
  'User Management': [
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_EDIT,
    Permission.USER_DELETE,
    Permission.USER_BAN,
    Permission.USER_PERMISSIONS,
  ],
  'System Configuration': [
    Permission.CONFIG_VIEW,
    Permission.CONFIG_EDIT,
    Permission.CONFIG_FEATURE_FLAGS,
    Permission.CONFIG_SYSTEM_SETTINGS,
    Permission.CONFIG_ENVIRONMENT_SYNC,
  ],
  'Analytics & Monitoring': [
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.ANALYTICS_REPORTS,
    Permission.MONITORING_VIEW,
    Permission.MONITORING_LOGS,
    Permission.MONITORING_ALERTS,
  ],
  'Database Management': [
    Permission.DATABASE_VIEW,
    Permission.DATABASE_EDIT,
    Permission.DATABASE_DELETE,
    Permission.DATABASE_BULK_OPS,
    Permission.DATABASE_EXPORT,
  ],
  'Testing Tools': [
    Permission.TESTING_API,
    Permission.TESTING_SOCKET,
    Permission.TESTING_LOAD,
  ],
  'Game Room Monitoring': [
    Permission.GAME_ROOMS_VIEW,
    Permission.GAME_ROOMS_MANAGE,
    Permission.GAME_ROOMS_MODERATE,
  ],
  'Security & Audit': [
    Permission.SECURITY_VIEW,
    Permission.SECURITY_MANAGE,
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,
  ],
  'Administration': [
    Permission.ADMIN_USERS,
    Permission.ADMIN_ROLES,
    Permission.ADMIN_SYSTEM,
  ],
};

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [Permission.USER_VIEW]: 'View user information and lists',
  [Permission.USER_CREATE]: 'Create new admin users',
  [Permission.USER_EDIT]: 'Edit existing user information',
  [Permission.USER_DELETE]: 'Delete user accounts',
  [Permission.USER_BAN]: 'Ban and unban game users',
  [Permission.USER_PERMISSIONS]: 'Manage user permissions and roles',

  [Permission.CONFIG_VIEW]: 'View system configuration',
  [Permission.CONFIG_EDIT]: 'Edit system configuration',
  [Permission.CONFIG_FEATURE_FLAGS]: 'Manage feature flags',
  [Permission.CONFIG_SYSTEM_SETTINGS]: 'Manage system settings',
  [Permission.CONFIG_ENVIRONMENT_SYNC]: 'Synchronize configurations between environments',

  [Permission.ANALYTICS_VIEW]: 'View analytics dashboards and metrics',
  [Permission.ANALYTICS_EXPORT]: 'Export analytics data',
  [Permission.ANALYTICS_REPORTS]: 'Generate and schedule reports',
  [Permission.MONITORING_VIEW]: 'View system monitoring data',
  [Permission.MONITORING_LOGS]: 'Access system logs',
  [Permission.MONITORING_ALERTS]: 'Manage monitoring alerts',

  [Permission.DATABASE_VIEW]: 'View database collections and documents',
  [Permission.DATABASE_EDIT]: 'Edit database documents',
  [Permission.DATABASE_DELETE]: 'Delete database documents',
  [Permission.DATABASE_BULK_OPS]: 'Perform bulk database operations',
  [Permission.DATABASE_EXPORT]: 'Export database data',

  [Permission.TESTING_API]: 'Use API testing tools',
  [Permission.TESTING_SOCKET]: 'Use WebSocket testing tools',
  [Permission.TESTING_LOAD]: 'Perform load testing',

  [Permission.GAME_ROOMS_VIEW]: 'View active game rooms',
  [Permission.GAME_ROOMS_MANAGE]: 'Manage game rooms (end, kick players)',
  [Permission.GAME_ROOMS_MODERATE]: 'Moderate game rooms and players',

  [Permission.SECURITY_VIEW]: 'View security events and logs',
  [Permission.SECURITY_MANAGE]: 'Manage security settings and policies',
  [Permission.AUDIT_VIEW]: 'View audit logs and trails',
  [Permission.AUDIT_EXPORT]: 'Export audit data',

  [Permission.ADMIN_USERS]: 'Manage admin user accounts',
  [Permission.ADMIN_ROLES]: 'Manage roles and permissions',
  [Permission.ADMIN_SYSTEM]: 'Manage system-level settings',
};