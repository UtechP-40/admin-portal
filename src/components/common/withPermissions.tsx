import React from 'react';
import { Permission, Role } from '../../types/permissions';
import { usePermissions } from '../../hooks/usePermissions';
import { Box, Typography, Alert } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

interface WithPermissionsOptions {
  permissions?: Permission[];
  roles?: Role[];
  requireAll?: boolean;
  fallback?: React.ComponentType;
  redirectTo?: string;
}

/**
 * Default fallback component for insufficient permissions
 */
const DefaultFallback: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      textAlign: 'center',
      p: 4,
    }}
  >
    <LockIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
    <Typography variant="h5" gutterBottom color="text.secondary">
      Access Denied
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
      You don't have permission to access this resource.
    </Typography>
    <Alert severity="warning" sx={{ maxWidth: 400 }}>
      Contact your administrator if you believe you should have access to this feature.
    </Alert>
  </Box>
);

/**
 * Higher-order component that wraps a component with permission checking
 */
export const withPermissions = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithPermissionsOptions = {}
) => {
  const {
    permissions = [],
    roles = [],
    requireAll = false,
    fallback: FallbackComponent = DefaultFallback,
    redirectTo,
  } = options;

  const WithPermissionsComponent: React.FC<P> = (props) => {
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

    // Redirect if specified and no access
    if (!hasAccess && redirectTo) {
      window.location.href = redirectTo;
      return null;
    }

    return hasAccess ? <WrappedComponent {...props} /> : <FallbackComponent />;
  };

  WithPermissionsComponent.displayName = `withPermissions(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithPermissionsComponent;
};

export default withPermissions;