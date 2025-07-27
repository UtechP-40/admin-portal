// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    PASSWORD_RESET_REQUEST: '/auth/password-reset-request',
    PASSWORD_RESET: '/auth/password-reset',
  },
  DATABASE: {
    COLLECTIONS: '/admin/collections',
    COLLECTION: (name: string) => `/admin/collections/${name}`,
    DOCUMENT: (collection: string, id: string) =>
      `/admin/collections/${collection}/${id}`,
  },
  ANALYTICS: {
    DASHBOARD: '/admin/analytics/dashboard',
    METRICS: '/admin/analytics/metrics',
    USERS: '/admin/analytics/users',
    GAMES: '/admin/analytics/games',
  },
  MONITORING: {
    SYSTEM_HEALTH: '/admin/monitoring/system-health',
    LOGS: '/admin/monitoring/logs',
    PERFORMANCE: '/admin/monitoring/performance',
  },
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  ADMIN_TOKEN: 'adminToken',
  ADMIN_REFRESH_TOKEN: 'adminRefreshToken',
  THEME_MODE: 'themeMode',
  USER_PREFERENCES: 'userPreferences',
} as const;

// Theme modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// User roles and permissions
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

export const PERMISSIONS = {
  DATABASE_READ: 'database:read',
  DATABASE_WRITE: 'database:write',
  DATABASE_DELETE: 'database:delete',
  ANALYTICS_VIEW: 'analytics:view',
  MONITORING_VIEW: 'monitoring:view',
  USERS_MANAGE: 'users:manage',
  SETTINGS_MANAGE: 'settings:manage',
} as const;
