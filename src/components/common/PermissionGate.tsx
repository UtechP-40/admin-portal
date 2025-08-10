import React from 'react';
import { Permission, Role } from '../../types/permissions';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionGateProps {
  children: React.ReactNode;
  permissions?: Permission[];
  roles?: Role[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback = null,
}) => {
  const { hasAnyPermission, hasAllPermissions, hasAnyRole } = usePermissions();

  // Check permissions
  let hasPermissionAccess = true;
  if (permissions.length > 0) {
    hasPermissionAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // Check roles
  let hasRoleAccess = true;
  if (roles.length > 0) {
    hasRoleAccess = hasAnyRole(roles);
  }

  // User must satisfy both permission and role requirements
  const hasAccess = hasPermissionAccess && hasRoleAccess;

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;