import { apiService } from './api';
import {
  DataProtectionSettings,
  ConsentRecord,
  DataSubjectRequest,
  DataInventory,
  PrivacyAuditLog,
  DataBreachIncident,
  EncryptionKey,
  DataAnonymizationRule,
  DataSubjectRequestType,
  DataSubjectRequestStatus,
  ConsentType,
  DataCategory,
  PrivacyAction,
  AnonymizationTechnique,
} from '../types/privacy';

export const privacyService = {
  // Data Protection Settings
  getDataProtectionSettings: async (): Promise<DataProtectionSettings> => {
    const response = await apiService.get('/privacy/settings');
    return response.data;
  },

  updateDataProtectionSettings: async (settings: Partial<DataProtectionSettings>): Promise<DataProtectionSettings> => {
    const response = await apiService.patch('/privacy/settings', settings);
    return response.data;
  },

  // Consent Management
  getConsentRecords: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    consentType?: ConsentType;
    granted?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    records: ConsentRecord[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/privacy/consent', { params });
    return response.data;
  },

  getConsentRecord: async (id: string): Promise<ConsentRecord> => {
    const response = await apiService.get(`/privacy/consent/${id}`);
    return response.data;
  },

  getUserConsents: async (userId: string): Promise<ConsentRecord[]> => {
    const response = await apiService.get(`/privacy/consent/user/${userId}`);
    return response.data;
  },

  updateConsent: async (id: string, granted: boolean, notes?: string): Promise<ConsentRecord> => {
    const response = await apiService.patch(`/privacy/consent/${id}`, { granted, notes });
    return response.data;
  },

  bulkUpdateConsents: async (ids: string[], granted: boolean, notes?: string): Promise<void> => {
    await apiService.patch('/privacy/consent/bulk', { ids, granted, notes });
  },

  // Data Subject Requests (GDPR Rights)
  getDataSubjectRequests: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    requestType?: DataSubjectRequestType;
    status?: DataSubjectRequestStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    requests: DataSubjectRequest[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/privacy/data-subject-requests', { params });
    return response.data;
  },

  getDataSubjectRequest: async (id: string): Promise<DataSubjectRequest> => {
    const response = await apiService.get(`/privacy/data-subject-requests/${id}`);
    return response.data;
  },

  createDataSubjectRequest: async (request: Omit<DataSubjectRequest, 'id' | 'requestedAt' | 'status'>): Promise<DataSubjectRequest> => {
    const response = await apiService.post('/privacy/data-subject-requests', request);
    return response.data;
  },

  updateDataSubjectRequestStatus: async (id: string, status: DataSubjectRequestStatus, notes?: string): Promise<DataSubjectRequest> => {
    const response = await apiService.patch(`/privacy/data-subject-requests/${id}/status`, { status, notes });
    return response.data;
  },

  processDataSubjectRequest: async (id: string, responseData?: any): Promise<DataSubjectRequest> => {
    const response = await apiService.post(`/privacy/data-subject-requests/${id}/process`, { responseData });
    return response.data;
  },

  // Data Export (Right to Portability)
  exportUserData: async (userId: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<Blob> => {
    const response = await apiService.get(`/privacy/export/user/${userId}`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Data Deletion (Right to be Forgotten)
  deleteUserData: async (userId: string, options?: {
    hardDelete?: boolean;
    retainLogs?: boolean;
    anonymize?: boolean;
  }): Promise<{
    success: boolean;
    deletedRecords: number;
    anonymizedRecords: number;
    retainedRecords: number;
    details: string[];
  }> => {
    const response = await apiService.delete(`/privacy/delete/user/${userId}`, { data: options });
    return response.data;
  },

  scheduleDataDeletion: async (userId: string, scheduledDate: Date, reason: string): Promise<void> => {
    await apiService.post(`/privacy/delete/schedule`, { userId, scheduledDate, reason });
  },

  // Data Inventory
  getDataInventory: async (params?: {
    page?: number;
    limit?: number;
    dataCategory?: DataCategory;
    riskLevel?: string;
    complianceStatus?: string;
  }): Promise<{
    inventory: DataInventory[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/privacy/data-inventory', { params });
    return response.data;
  },

  createDataInventoryItem: async (item: Omit<DataInventory, 'id'>): Promise<DataInventory> => {
    const response = await apiService.post('/privacy/data-inventory', item);
    return response.data;
  },

  updateDataInventoryItem: async (id: string, item: Partial<DataInventory>): Promise<DataInventory> => {
    const response = await apiService.patch(`/privacy/data-inventory/${id}`, item);
    return response.data;
  },

  deleteDataInventoryItem: async (id: string): Promise<void> => {
    await apiService.delete(`/privacy/data-inventory/${id}`);
  },

  // Privacy Audit Logs
  getPrivacyAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: PrivacyAction;
    dataType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    logs: PrivacyAuditLog[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/privacy/audit-logs', { params });
    return response.data;
  },

  exportPrivacyAuditLogs: async (params?: {
    startDate?: Date;
    endDate?: Date;
    format?: 'csv' | 'json' | 'xlsx';
  }): Promise<Blob> => {
    const response = await apiService.get('/privacy/audit-logs/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Data Breach Management
  getDataBreachIncidents: async (params?: {
    page?: number;
    limit?: number;
    severity?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    incidents: DataBreachIncident[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get('/privacy/data-breaches', { params });
    return response.data;
  },

  createDataBreachIncident: async (incident: Omit<DataBreachIncident, 'id' | 'detectedAt'>): Promise<DataBreachIncident> => {
    const response = await apiService.post('/privacy/data-breaches', incident);
    return response.data;
  },

  updateDataBreachIncident: async (id: string, incident: Partial<DataBreachIncident>): Promise<DataBreachIncident> => {
    const response = await apiService.patch(`/privacy/data-breaches/${id}`, incident);
    return response.data;
  },

  notifyRegulatoryAuthority: async (incidentId: string, details: {
    authority: string;
    contactInfo: string;
    notificationMethod: string;
    additionalInfo?: string;
  }): Promise<void> => {
    await apiService.post(`/privacy/data-breaches/${incidentId}/notify-regulator`, details);
  },

  notifyAffectedUsers: async (incidentId: string, details: {
    notificationMethod: 'email' | 'sms' | 'in_app' | 'postal';
    message: string;
    includeRemediation: boolean;
  }): Promise<void> => {
    await apiService.post(`/privacy/data-breaches/${incidentId}/notify-users`, details);
  },

  // Encryption Management
  getEncryptionKeys: async (): Promise<EncryptionKey[]> => {
    const response = await apiService.get('/privacy/encryption/keys');
    return response.data;
  },

  rotateEncryptionKey: async (keyId: string): Promise<EncryptionKey> => {
    const response = await apiService.post(`/privacy/encryption/keys/${keyId}/rotate`);
    return response.data;
  },

  revokeEncryptionKey: async (keyId: string, reason: string): Promise<void> => {
    await apiService.post(`/privacy/encryption/keys/${keyId}/revoke`, { reason });
  },

  encryptData: async (data: any, keyId?: string): Promise<{
    encryptedData: string;
    keyId: string;
    algorithm: string;
  }> => {
    const response = await apiService.post('/privacy/encryption/encrypt', { data, keyId });
    return response.data;
  },

  decryptData: async (encryptedData: string, keyId: string): Promise<any> => {
    const response = await apiService.post('/privacy/encryption/decrypt', { encryptedData, keyId });
    return response.data;
  },

  // Data Anonymization
  getAnonymizationRules: async (): Promise<DataAnonymizationRule[]> => {
    const response = await apiService.get('/privacy/anonymization/rules');
    return response.data;
  },

  createAnonymizationRule: async (rule: Omit<DataAnonymizationRule, 'id' | 'createdAt' | 'updatedAt' | 'appliedCount' | 'lastAppliedAt'>): Promise<DataAnonymizationRule> => {
    const response = await apiService.post('/privacy/anonymization/rules', rule);
    return response.data;
  },

  updateAnonymizationRule: async (id: string, rule: Partial<DataAnonymizationRule>): Promise<DataAnonymizationRule> => {
    const response = await apiService.patch(`/privacy/anonymization/rules/${id}`, rule);
    return response.data;
  },

  deleteAnonymizationRule: async (id: string): Promise<void> => {
    await apiService.delete(`/privacy/anonymization/rules/${id}`);
  },

  applyAnonymizationRule: async (ruleId: string, dataIds: string[]): Promise<{
    success: boolean;
    processedRecords: number;
    errors: string[];
  }> => {
    const response = await apiService.post(`/privacy/anonymization/rules/${ruleId}/apply`, { dataIds });
    return response.data;
  },

  testAnonymizationRule: async (ruleId: string, sampleData: any): Promise<{
    originalData: any;
    anonymizedData: any;
    technique: AnonymizationTechnique;
    parameters: Record<string, any>;
  }> => {
    const response = await apiService.post(`/privacy/anonymization/rules/${ruleId}/test`, { sampleData });
    return response.data;
  },

  // Compliance Reports
  generateComplianceReport: async (params: {
    type: 'gdpr' | 'ccpa' | 'hipaa' | 'custom';
    startDate: Date;
    endDate: Date;
    includeMetrics?: boolean;
    includeAuditLogs?: boolean;
    includeBreaches?: boolean;
    format?: 'pdf' | 'html' | 'json';
  }): Promise<Blob> => {
    const response = await apiService.post('/privacy/reports/compliance', params, {
      responseType: 'blob'
    });
    return response.data;
  },

  getComplianceMetrics: async (timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalDataSubjects: number;
    activeConsents: number;
    revokedConsents: number;
    pendingRequests: number;
    completedRequests: number;
    dataBreaches: number;
    encryptedDataPercentage: number;
    anonymizedDataPercentage: number;
    complianceScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
  }> => {
    const response = await apiService.get('/privacy/metrics/compliance', { params: timeRange });
    return response.data;
  },

  // Privacy Impact Assessment
  conductPrivacyImpactAssessment: async (assessment: {
    projectName: string;
    description: string;
    dataTypes: DataCategory[];
    processingPurposes: string[];
    dataSubjects: string[];
    riskFactors: string[];
    mitigationMeasures: string[];
  }): Promise<{
    assessmentId: string;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    requiresDPOReview: boolean;
    requiresRegulatoryConsultation: boolean;
  }> => {
    const response = await apiService.post('/privacy/pia/conduct', assessment);
    return response.data;
  },

  // Cookie Consent Management
  getCookieConsentSettings: async (): Promise<{
    enabled: boolean;
    strictlyNecessary: string[];
    functional: string[];
    analytics: string[];
    marketing: string[];
    consentBannerText: string;
    privacyPolicyUrl: string;
  }> => {
    const response = await apiService.get('/privacy/cookies/settings');
    return response.data;
  },

  updateCookieConsentSettings: async (settings: any): Promise<void> => {
    await apiService.patch('/privacy/cookies/settings', settings);
  },
};

export default privacyService;