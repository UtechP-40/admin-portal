import { apiService } from './api';
import {
  SecurityEventType,
  SecuritySeverity,
  SecurityEventStatus,
  ThreatStatus
} from '../types/security';
import type {
  SecurityEvent,
  SecurityThreat,
  SecurityMetrics,
  SecurityAlert,
  SecurityDashboardData,
  RiskAssessment,
  SecurityConfiguration,
  IntrusionDetectionRule,
  SecurityAuditLog,
} from '../types/security';

export const securityService = {
  // Security Events
  getSecurityEvents: async (params?: {
    page?: number;
    limit?: number;
    severity?: SecuritySeverity;
    type?: SecurityEventType;
    status?: SecurityEventStatus;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }): Promise<{
    events: SecurityEvent[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/security/events', { params });
    return response.data;
  },

  getSecurityEvent: async (id: string): Promise<SecurityEvent> => {
    const response = await apiService.get(`/security/events/${id}`);
    return response.data;
  },

  updateSecurityEventStatus: async (id: string, status: SecurityEventStatus, notes?: string): Promise<SecurityEvent> => {
    const response = await apiService.patch(`/security/events/${id}/status`, { status, notes });
    return response.data;
  },

  bulkUpdateSecurityEvents: async (ids: string[], status: SecurityEventStatus, notes?: string): Promise<void> => {
    await apiService.patch('/security/events/bulk-update', { ids, status, notes });
  },

  // Security Threats
  getSecurityThreats: async (params?: {
    page?: number;
    limit?: number;
    severity?: SecuritySeverity;
    status?: ThreatStatus;
    category?: string;
  }): Promise<{
    threats: SecurityThreat[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/security/threats', { params });
    return response.data;
  },

  getSecurityThreat: async (id: string): Promise<SecurityThreat> => {
    const response = await apiService.get(`/security/threats/${id}`);
    return response.data;
  },

  updateThreatStatus: async (id: string, status: ThreatStatus, notes?: string): Promise<SecurityThreat> => {
    const response = await apiService.patch(`/security/threats/${id}/status`, { status, notes });
    return response.data;
  },

  // Security Metrics and Dashboard
  getSecurityMetrics: async (timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<SecurityMetrics> => {
    const response = await apiService.get('/security/metrics', { params: timeRange });
    return response.data;
  },

  getSecurityDashboard: async (): Promise<SecurityDashboardData> => {
    const response = await apiService.get('/security/dashboard');
    return response.data;
  },

  getRiskAssessment: async (): Promise<RiskAssessment> => {
    const response = await apiService.get('/security/risk-assessment');
    return response.data;
  },

  // Security Alerts
  getSecurityAlerts: async (params?: {
    active?: boolean;
    severity?: SecuritySeverity;
  }): Promise<SecurityAlert[]> => {
    const response = await apiService.get('/security/alerts', { params });
    return response.data;
  },

  createSecurityAlert: async (alert: Omit<SecurityAlert, 'id' | 'isActive' | 'triggeredAt' | 'resolvedAt'>): Promise<SecurityAlert> => {
    const response = await apiService.post('/security/alerts', alert);
    return response.data;
  },

  updateSecurityAlert: async (id: string, alert: Partial<SecurityAlert>): Promise<SecurityAlert> => {
    const response = await apiService.patch(`/security/alerts/${id}`, alert);
    return response.data;
  },

  deleteSecurityAlert: async (id: string): Promise<void> => {
    await apiService.delete(`/security/alerts/${id}`);
  },

  acknowledgeAlert: async (id: string): Promise<void> => {
    await apiService.post(`/security/alerts/${id}/acknowledge`);
  },

  resolveAlert: async (id: string, resolution: string): Promise<void> => {
    await apiService.post(`/security/alerts/${id}/resolve`, { resolution });
  },

  // Security Configuration
  getSecurityConfiguration: async (): Promise<SecurityConfiguration> => {
    const response = await apiService.get('/security/configuration');
    return response.data;
  },

  updateSecurityConfiguration: async (config: Partial<SecurityConfiguration>): Promise<SecurityConfiguration> => {
    const response = await apiService.patch('/security/configuration', config);
    return response.data;
  },

  // Intrusion Detection Rules
  getIntrusionDetectionRules: async (): Promise<IntrusionDetectionRule[]> => {
    const response = await apiService.get('/security/intrusion-detection/rules');
    return response.data;
  },

  createIntrusionDetectionRule: async (rule: Omit<IntrusionDetectionRule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount' | 'lastTriggered'>): Promise<IntrusionDetectionRule> => {
    const response = await apiService.post('/security/intrusion-detection/rules', rule);
    return response.data;
  },

  updateIntrusionDetectionRule: async (id: string, rule: Partial<IntrusionDetectionRule>): Promise<IntrusionDetectionRule> => {
    const response = await apiService.patch(`/security/intrusion-detection/rules/${id}`, rule);
    return response.data;
  },

  deleteIntrusionDetectionRule: async (id: string): Promise<void> => {
    await apiService.delete(`/security/intrusion-detection/rules/${id}`);
  },

  testIntrusionDetectionRule: async (id: string, testData: any): Promise<{ matched: boolean; details: string }> => {
    const response = await apiService.post(`/security/intrusion-detection/rules/${id}/test`, testData);
    return response.data;
  },

  // IP Management
  getBlockedIps: async (): Promise<Array<{
    ip: string;
    reason: string;
    blockedAt: Date;
    expiresAt?: Date;
    isActive: boolean;
  }>> => {
    const response = await apiService.get('/security/blocked-ips');
    return response.data;
  },

  blockIp: async (ip: string, reason: string, duration?: number): Promise<void> => {
    await apiService.post('/security/blocked-ips', { ip, reason, duration });
  },

  unblockIp: async (ip: string): Promise<void> => {
    await apiService.delete(`/security/blocked-ips/${ip}`);
  },

  // Security Audit Logs
  getSecurityAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }): Promise<{
    logs: SecurityAuditLog[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/security/audit-logs', { params });
    return response.data;
  },

  exportSecurityAuditLogs: async (params?: {
    startDate?: Date;
    endDate?: Date;
    format?: 'csv' | 'json' | 'xlsx';
  }): Promise<Blob> => {
    const response = await apiService.get('/security/audit-logs/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Real-time Security Monitoring
  subscribeToSecurityEvents: (callback: (event: SecurityEvent) => void): () => void => {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll simulate with polling
    const interval = setInterval(async () => {
      try {
        const response = await apiService.get('/security/events/recent');
        const events: SecurityEvent[] = response.data;
        events.forEach(callback);
      } catch (error) {
        console.error('Failed to fetch recent security events:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  },

  // Security Reports
  generateSecurityReport: async (params: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    startDate?: Date;
    endDate?: Date;
    includeMetrics?: boolean;
    includeThreats?: boolean;
    includeEvents?: boolean;
    format?: 'pdf' | 'html' | 'json';
  }): Promise<Blob> => {
    const response = await apiService.post('/security/reports/generate', params, {
      responseType: 'blob'
    });
    return response.data;
  },

  scheduleSecurityReport: async (schedule: {
    name: string;
    type: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    includeMetrics: boolean;
    includeThreats: boolean;
    includeEvents: boolean;
    format: 'pdf' | 'html';
  }): Promise<void> => {
    await apiService.post('/security/reports/schedule', schedule);
  },

  // Threat Intelligence
  getThreatIntelligence: async (): Promise<{
    feeds: Array<{
      name: string;
      lastUpdated: Date;
      threatCount: number;
      status: 'active' | 'inactive' | 'error';
    }>;
    indicators: Array<{
      type: 'ip' | 'domain' | 'hash' | 'url';
      value: string;
      severity: SecuritySeverity;
      source: string;
      firstSeen: Date;
      lastSeen: Date;
    }>;
  }> => {
    const response = await apiService.get('/security/threat-intelligence');
    return response.data;
  },

  // Security Health Check
  performSecurityHealthCheck: async (): Promise<{
    overall: 'healthy' | 'warning' | 'critical';
    checks: Array<{
      name: string;
      status: 'pass' | 'warning' | 'fail';
      message: string;
      details?: string;
    }>;
    recommendations: string[];
  }> => {
    const response = await apiService.post('/security/health-check');
    return response.data;
  }
};

export default securityService;