import { apiService } from './api';
import type {
  AuditEvent,
  AuditEventType,
  AuditCategory,
  AuditSeverity,
  AuditLogQuery,
  AuditLogResponse,
  AuditStatistics,
  AuditAlert,
  AuditExportOptions,
  AuditRetentionPolicy,
} from '../types/audit';

// Client-side audit context
interface AuditContext {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogger {
  private context: AuditContext = {};
  private pendingEvents: Partial<AuditEvent>[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startBatchFlush();
    this.setupBeforeUnload();
  }

  // Set audit context (usually called after login)
  setContext(context: AuditContext) {
    this.context = { ...this.context, ...context };
  }

  // Clear audit context (usually called after logout)
  clearContext() {
    this.context = {};
  }

  // Log an audit event
  async logEvent(event: Partial<AuditEvent>): Promise<void> {
    const fullEvent: Partial<AuditEvent> = {
      ...event,
      timestamp: new Date(),
      ...this.context,
      ipAddress: this.context.ipAddress || await this.getClientIP(),
      userAgent: this.context.userAgent || navigator.userAgent,
      sessionId: this.context.sessionId || this.generateSessionId(),
    };

    // Add to pending events for batch processing
    this.pendingEvents.push(fullEvent);

    // Flush immediately for critical events
    if (event.severity === AuditSeverity.CRITICAL) {
      await this.flush();
    } else if (this.pendingEvents.length >= this.batchSize) {
      await this.flush();
    }
  }

  // Flush pending events to server
  private async flush(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const eventsToSend = [...this.pendingEvents];
    this.pendingEvents = [];

    try {
      await apiService.post('/audit/events/batch', { events: eventsToSend });
    } catch (error) {
      console.error('Failed to send audit events:', error);
      // Re-add events to pending if they failed to send
      this.pendingEvents.unshift(...eventsToSend);
    }
  }

  // Start automatic batch flushing
  private startBatchFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }

  // Setup beforeunload handler to flush pending events
  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      if (this.pendingEvents.length > 0) {
        // Use sendBeacon for reliable delivery during page unload
        const data = JSON.stringify({ events: this.pendingEvents });
        navigator.sendBeacon('/admin/api/audit/events/batch', data);
      }
    });
  }

  // Get client IP address (best effort)
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush().catch(console.error);
  }
}

// Global audit logger instance
const auditLogger = new AuditLogger();

// Audit service
export const auditService = {
  // Initialize audit context
  initializeContext: (context: AuditContext) => {
    auditLogger.setContext(context);
  },

  // Clear audit context
  clearContext: () => {
    auditLogger.clearContext();
  },

  // Log authentication events
  logLogin: async (userEmail: string, success: boolean, errorMessage?: string) => {
    await auditLogger.logEvent({
      eventType: success ? AuditEventType.LOGIN : AuditEventType.LOGIN_FAILED,
      category: AuditCategory.AUTHENTICATION,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      action: 'login',
      description: success 
        ? `User ${userEmail} logged in successfully`
        : `Failed login attempt for ${userEmail}`,
      success,
      errorMessage,
      metadata: { userEmail },
    });
  },

  logLogout: async (userEmail: string) => {
    await auditLogger.logEvent({
      eventType: AuditEventType.LOGOUT,
      category: AuditCategory.AUTHENTICATION,
      severity: AuditSeverity.LOW,
      action: 'logout',
      description: `User ${userEmail} logged out`,
      success: true,
      metadata: { userEmail },
    });
  },

  logMFAVerification: async (userEmail: string, success: boolean, errorMessage?: string, method?: string) => {
    await auditLogger.logEvent({
      eventType: success ? AuditEventType.LOGIN : AuditEventType.LOGIN_FAILED,
      category: AuditCategory.AUTHENTICATION,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      action: 'mfa_verification',
      description: success 
        ? `User ${userEmail} completed MFA verification successfully${method ? ` using ${method}` : ''}`
        : `Failed MFA verification for ${userEmail}${method ? ` using ${method}` : ''}`,
      success,
      errorMessage,
      metadata: { userEmail, method, mfaVerification: true },
    });
  },

  // Log user management events
  logUserCreated: async (targetUserId: string, targetUserEmail: string, userData: any) => {
    await auditLogger.logEvent({
      eventType: AuditEventType.USER_CREATED,
      category: AuditCategory.USER_MANAGEMENT,
      severity: AuditSeverity.MEDIUM,
      resource: 'user',
      resourceId: targetUserId,
      action: 'create',
      description: `Created user ${targetUserEmail}`,
      success: true,
      newValues: userData,
      metadata: { targetUserId, targetUserEmail },
    });
  },

  logUserUpdated: async (targetUserId: string, targetUserEmail: string, oldData: any, newData: any) => {
    await auditLogger.logEvent({
      eventType: AuditEventType.USER_UPDATED,
      category: AuditCategory.USER_MANAGEMENT,
      severity: AuditSeverity.MEDIUM,
      resource: 'user',
      resourceId: targetUserId,
      action: 'update',
      description: `Updated user ${targetUserEmail}`,
      success: true,
      oldValues: oldData,
      newValues: newData,
      metadata: { targetUserId, targetUserEmail },
    });
  },

  logUserDeleted: async (targetUserId: string, targetUserEmail: string) => {
    await auditLogger.logEvent({
      eventType: AuditEventType.USER_DELETED,
      category: AuditCategory.USER_MANAGEMENT,
      severity: AuditSeverity.HIGH,
      resource: 'user',
      resourceId: targetUserId,
      action: 'delete',
      description: `Deleted user ${targetUserEmail}`,
      success: true,
      metadata: { targetUserId, targetUserEmail },
    });
  },

  // Log configuration events
  logConfigurationChange: async (configKey: string, oldValue: any, newValue: any) => {
    await auditLogger.logEvent({
      eventType: AuditEventType.CONFIG_UPDATED,
      category: AuditCategory.SYSTEM_CONFIGURATION,
      severity: AuditSeverity.MEDIUM,
      resource: 'configuration',
      resourceId: configKey,
      action: 'update',
      description: `Updated configuration ${configKey}`,
      success: true,
      oldValues: { [configKey]: oldValue },
      newValues: { [configKey]: newValue },
      metadata: { configKey },
    });
  },

  // Log database events
  logDatabaseOperation: async (operation: string, collection: string, documentId?: string, data?: any) => {
    await auditLogger.logEvent({
      eventType: AuditEventType.DATABASE_QUERY,
      category: AuditCategory.DATABASE,
      severity: AuditSeverity.LOW,
      resource: 'database',
      resourceId: documentId || collection,
      action: operation,
      description: `${operation} operation on ${collection}${documentId ? ` (${documentId})` : ''}`,
      success: true,
      metadata: { collection, operation, documentId, data },
    });
  },

  // Log security events
  logSecurityEvent: async (eventType: AuditEventType, description: string, severity: AuditSeverity = AuditSeverity.HIGH, metadata?: any) => {
    await auditLogger.logEvent({
      eventType,
      category: AuditCategory.SECURITY,
      severity,
      action: 'security_event',
      description,
      success: false,
      metadata,
    });
  },

  // Log permission denied events
  logPermissionDenied: async (resource: string, action: string, requiredPermissions: string[]) => {
    await auditLogger.logEvent({
      eventType: AuditEventType.PERMISSION_DENIED,
      category: AuditCategory.AUTHORIZATION,
      severity: AuditSeverity.MEDIUM,
      resource,
      action,
      description: `Permission denied for ${action} on ${resource}`,
      success: false,
      metadata: { resource, action, requiredPermissions },
    });
  },

  // API methods for retrieving audit data
  getAuditLogs: async (query: AuditLogQuery): Promise<AuditLogResponse> => {
    const response = await apiService.get<AuditLogResponse>('/audit/logs', { params: query });
    return response.data;
  },

  getAuditStatistics: async (timeRange?: { startDate: Date; endDate: Date }): Promise<AuditStatistics> => {
    const response = await apiService.get<AuditStatistics>('/audit/statistics', { params: timeRange });
    return response.data;
  },

  getAuditEvent: async (eventId: string): Promise<AuditEvent> => {
    const response = await apiService.get<AuditEvent>(`/audit/events/${eventId}`);
    return response.data;
  },

  // Alert management
  getAuditAlerts: async (): Promise<AuditAlert[]> => {
    const response = await apiService.get<AuditAlert[]>('/audit/alerts');
    return response.data;
  },

  createAuditAlert: async (alert: Omit<AuditAlert, 'id' | 'createdAt' | 'updatedAt' | 'lastTriggered' | 'triggerCount'>): Promise<AuditAlert> => {
    const response = await apiService.post<AuditAlert>('/audit/alerts', alert);
    return response.data;
  },

  updateAuditAlert: async (alertId: string, alert: Partial<AuditAlert>): Promise<AuditAlert> => {
    const response = await apiService.put<AuditAlert>(`/audit/alerts/${alertId}`, alert);
    return response.data;
  },

  deleteAuditAlert: async (alertId: string): Promise<void> => {
    await apiService.delete(`/audit/alerts/${alertId}`);
  },

  // Export audit data
  exportAuditLogs: async (options: AuditExportOptions): Promise<Blob> => {
    const response = await apiService.post('/audit/export', options, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Retention policies
  getRetentionPolicies: async (): Promise<AuditRetentionPolicy[]> => {
    const response = await apiService.get<AuditRetentionPolicy[]>('/audit/retention-policies');
    return response.data;
  },

  createRetentionPolicy: async (policy: Omit<AuditRetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuditRetentionPolicy> => {
    const response = await apiService.post<AuditRetentionPolicy>('/audit/retention-policies', policy);
    return response.data;
  },

  updateRetentionPolicy: async (policyId: string, policy: Partial<AuditRetentionPolicy>): Promise<AuditRetentionPolicy> => {
    const response = await apiService.put<AuditRetentionPolicy>(`/audit/retention-policies/${policyId}`, policy);
    return response.data;
  },

  deleteRetentionPolicy: async (policyId: string): Promise<void> => {
    await apiService.delete(`/audit/retention-policies/${policyId}`);
  },
};

// Export the audit logger for direct use if needed
export { auditLogger };

export default auditService;