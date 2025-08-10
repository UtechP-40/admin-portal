import { Permission, Role, ROLE_PERMISSIONS } from '../types/permissions';
import type { User } from '../types/auth';

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;

  // Check if user has the permission directly
  if (user.permissions.includes(permission)) {
    return true;
  }

  // Check if user's role includes the permission
  const userRole = user.role as Role;
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  
  return rolePermissions.includes(permission);
};

/**
 * Check if a user has any of the specified permissions
 */
export const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  if (!user || permissions.length === 0) return false;
  
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if a user has all of the specified permissions
 */
export const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  if (!user || permissions.length === 0) return false;
  
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Get all permissions for a user (from role + direct permissions)
 */
export const getUserPermissions = (user: User | null): Permission[] => {
  if (!user) return [];

  const userRole = user.role as Role;
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  const directPermissions = user.permissions as Permission[];

  // Combine and deduplicate permissions
  const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];
  
  return allPermissions;
};

/**
 * Check if a user has a specific role
 */
export const hasRole = (user: User | null, role: Role): boolean => {
  if (!user) return false;
  return user.role === role;
};

/**
 * Check if a user has any of the specified roles
 */
export const hasAnyRole = (user: User | null, roles: Role[]): boolean => {
  if (!user || roles.length === 0) return false;
  
  return roles.includes(user.role as Role);
};

/**
 * Check if a user is a super admin
 */
export const isSuperAdmin = (user: User | null): boolean => {
  return hasRole(user, Role.SUPER_ADMIN);
};

/**
 * Check if a user is an admin (admin or super admin)
 */
export const isAdmin = (user: User | null): boolean => {
  return hasAnyRole(user, [Role.ADMIN, Role.SUPER_ADMIN]);
};

/**
 * Get permission level for a user (0-5, higher is more privileged)
 */
export const getPermissionLevel = (user: User | null): number => {
  if (!user) return 0;

  const roleLevel: Record<Role, number> = {
    [Role.SUPER_ADMIN]: 5,
    [Role.ADMIN]: 4,
    [Role.MODERATOR]: 3,
    [Role.ANALYST]: 2,
    [Role.SUPPORT]: 1,
    [Role.VIEWER]: 0,
  };

  return roleLevel[user.role as Role] || 0;
};

/**
 * Check if user can access a route based on required permissions
 */
export const canAccessRoute = (
  user: User | null, 
  requiredPermissions: Permission[] = [],
  requireAll: boolean = false
): boolean => {
  if (requiredPermissions.length === 0) return true;
  
  return requireAll 
    ? hasAllPermissions(user, requiredPermissions)
    : hasAnyPermission(user, requiredPermissions);
};

/**
 * Filter menu items based on user permissions
 */
export interface MenuItem {
  id: string;
  label: string;
  path?: string;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  children?: MenuItem[];
}

export const filterMenuItems = (user: User | null, menuItems: MenuItem[]): MenuItem[] => {
  return menuItems
    .filter(item => {
      if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
        return true;
      }
      
      return canAccessRoute(user, item.requiredPermissions, item.requireAll);
    })
    .map(item => ({
      ...item,
      children: item.children ? filterMenuItems(user, item.children) : undefined,
    }))
    .filter(item => !item.children || item.children.length > 0);
};

/**
 * Create a permission checker function for a specific user
 */
export const createPermissionChecker = (user: User | null) => ({
  hasPermission: (permission: Permission) => hasPermission(user, permission),
  hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(user, permissions),
  hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(user, permissions),
  hasRole: (role: Role) => hasRole(user, role),
  hasAnyRole: (roles: Role[]) => hasAnyRole(user, roles),
  isSuperAdmin: () => isSuperAdmin(user),
  isAdmin: () => isAdmin(user),
  canAccessRoute: (requiredPermissions: Permission[] = [], requireAll = false) => 
    canAccessRoute(user, requiredPermissions, requireAll),
  getPermissionLevel: () => getPermissionLevel(user),
  getUserPermissions: () => getUserPermissions(user),
});