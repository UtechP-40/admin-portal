import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { auditService } from '../services/auditService';
import { AuditEventType, AuditSeverity } from '../types/audit';

/**
 * Hook for audit logging functionality
 */
export const useAuditLogger = () => {
  const { user, isAuthenticated } = useAuth();

  // Initialize audit context when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      auditService.initializeContext({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
      });
    } else {
      auditService.clearContext();
    }
  }, [user, isAuthenticated]);

  // Audit logging functions
  const logUserAction = useCallback(async (
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: any,
    severity: AuditSeverity = AuditSeverity.LOW
  ) => {
    if (!isAuthenticated) return;

    try {
      await auditService.logDatabaseOperation(action, resource, resourceId, metadata);
    } catch (error) {
      console.error('Failed to log user action:', error);
    }
  }, [isAuthenticated]);

  const logConfigurationChange = useCallback(async (
    configKey: string,
    oldValue: any,
    newValue: any
  ) => {
    if (!isAuthenticated) return;

    try {
      await auditService.logConfigurationChange(configKey, oldValue, newValue);
    } catch (error) {
      console.error('Failed to log configuration change:', error);
    }
  }, [isAuthenticated]);

  const logSecurityEvent = useCallback(async (
    eventType: AuditEventType,
    description: string,
    severity: AuditSeverity = AuditSeverity.HIGH,
    metadata?: any
  ) => {
    try {
      await auditService.logSecurityEvent(eventType, description, severity, metadata);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, []);

  const logPermissionDenied = useCallback(async (
    resource: string,
    action: string,
    requiredPermissions: string[]
  ) => {
    try {
      await auditService.logPermissionDenied(resource, action, requiredPermissions);
    } catch (error) {
      console.error('Failed to log permission denied:', error);
    }
  }, []);

  return {
    logUserAction,
    logConfigurationChange,
    logSecurityEvent,
    logPermissionDenied,
    auditService,
  };
};

export default useAuditLogger;