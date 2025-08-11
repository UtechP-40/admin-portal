import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission, Role } from '../../types/permissions';
import LoadingSpinner from './LoadingSpinner';
import { Box, Typography, Alert } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: Role[];
  requireAll?: boolean;
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

const AccessDeniedPage: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      p: 4,
    }}
  >
    <LockIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
    <Typography variant="h4" gutterBottom color="text.secondary">
      Access Denied
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
      You don't have the required permissions to access this page. 
      Please contact your administrator if you believe this is an error.
    </Typography>
    <Alert severity="warning" sx={{ maxWidth: 500 }}>
      If you need access to this feature, please request the appropriate permissions 
      from your system administrator.
    </Alert>
  </Box>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = false,
  fallbackPath = '/dashboard',
  showAccessDenied = true,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { hasAnyPermission, hasAllPermissions, hasAnyRole } = usePermissions();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permissions if required
  if (requiredPermissions.length > 0) {
    const hasPermissionAccess = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasPermissionAccess) {
      return showAccessDenied ? <AccessDeniedPage /> : <Navigate to={fallbackPath} replace />;
    }
  }

  // Check roles if required
  if (requiredRoles.length > 0) {
    const hasRoleAccess = hasAnyRole(requiredRoles);

    if (!hasRoleAccess) {
      return showAccessDenied ? <AccessDeniedPage /> : <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
