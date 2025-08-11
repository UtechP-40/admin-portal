import { useMemo } from 'react';
import { useAuth } from './useAuth';
import type { Permission, Role } from '../types/permissions';
import { createPermissionChecker } from '../utils/permissions';

/**
 * Hook for checking user permissions
 */
export const usePermissions = () => {
  const { user } = useAuth();

  const permissionChecker = useMemo(() => {
    return createPermissionChecker(user);
  }, [user]);

  return permissionChecker;
};

/**
 * Hook for checking a specific permission
 */
export const useHasPermission = (permission: Permission): boolean => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
};

/**
 * Hook for checking multiple permissions (any)
 */
export const useHasAnyPermission = (permissions: Permission[]): boolean => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(permissions);
};

/**
 * Hook for checking multiple permissions (all)
 */
export const useHasAllPermissions = (permissions: Permission[]): boolean => {
  const { hasAllPermissions } = usePermissions();
  return hasAllPermissions(permissions);
};

/**
 * Hook for checking user role
 */
export const useHasRole = (role: Role): boolean => {
  const { hasRole } = usePermissions();
  return hasRole(role);
};

/**
 * Hook for checking multiple roles
 */
export const useHasAnyRole = (roles: Role[]): boolean => {
  const { hasAnyRole } = usePermissions();
  return hasAnyRole(roles);
};

/**
 * Hook for checking if user is admin
 */
export const useIsAdmin = (): boolean => {
  const { isAdmin } = usePermissions();
  return isAdmin();
};

/**
 * Hook for checking if user is super admin
 */
export const useIsSuperAdmin = (): boolean => {
  const { isSuperAdmin } = usePermissions();
  return isSuperAdmin();
};

/**
 * Hook for getting user's permission level
 */
export const usePermissionLevel = (): number => {
  const { getPermissionLevel } = usePermissions();
  return getPermissionLevel();
};

/**
 * Hook for getting all user permissions
 */
export const useUserPermissions = (): Permission[] => {
  const { getUserPermissions } = usePermissions();
  return getUserPermissions();
};

export default usePermissions;