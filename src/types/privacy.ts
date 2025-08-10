export interface DataProtectionSettings {
  encryptionEnabled: boolean;
  encryptionAlgorithm: 'AES-256' | 'AES-128' | 'ChaCha20';
  keyRotationInterval: number; // days
  dataRetentionPeriod: number; // days
  automaticDeletion: boolean;
  gdprCompliance: {
    enabled: boolean;
    dataProcessingBasis: DataProcessingBasis[];
    consentManagement: boolean;
    rightToBeForgettenEnabled: boolean;
    dataPortabilityEnabled: boolean;
    privacyPolicyUrl?: string;
    dpoContact?: string;
  };
  auditTrail: {
    enabled: boolean;
    retentionPeriod: number; // days
    includeDataAccess: boolean;
    includeDataModification: boolean;
    includeDataDeletion: boolean;
  };
}

export enum DataProcessingBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

export interface ConsentRecord {
  id: string;
  userId: string;
  username: string;
  email: string;
  consentType: ConsentType;
  purpose: string;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  ipAddress: string;
  userAgent: string;
  version: string; // Privacy policy version
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export enum ConsentType {
  DATA_PROCESSING = 'data_processing',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  COOKIES = 'cookies',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  PROFILING = 'profiling'
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  username: string;
  email: string;
  requestType: DataSubjectRequestType;
  status: DataSubjectRequestStatus;
  description: string;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  processedBy?: string;
  verificationMethod: VerificationMethod;
  verificationData?: Record<string, any>;
  responseData?: any;
  notes?: string;
  attachments?: string[];
}

export enum DataSubjectRequestType {
  ACCESS = 'access', // Right to access
  RECTIFICATION = 'rectification', // Right to rectification
  ERASURE = 'erasure', // Right to be forgotten
  PORTABILITY = 'portability', // Right to data portability
  RESTRICTION = 'restriction', // Right to restriction of processing
  OBJECTION = 'objection', // Right to object
  WITHDRAW_CONSENT = 'withdraw_consent' // Right to withdraw consent
}

export enum DataSubjectRequestStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum VerificationMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  IDENTITY_DOCUMENT = 'identity_document',
  SECURITY_QUESTIONS = 'security_questions',
  TWO_FACTOR = 'two_factor'
}

export interface DataInventory {
  id: string;
  dataCategory: DataCategory;
  dataType: string;
  description: string;
  source: string;
  location: string;
  retentionPeriod: number; // days
  processingBasis: DataProcessingBasis[];
  isEncrypted: boolean;
  isPseudonymized: boolean;
  isAnonymized: boolean;
  accessLevel: AccessLevel;
  thirdPartySharing: boolean;
  thirdParties?: string[];
  lastAuditDate?: Date;
  complianceStatus: ComplianceStatus;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}

export enum DataCategory {
  PERSONAL_IDENTIFIERS = 'personal_identifiers',
  CONTACT_INFORMATION = 'contact_information',
  DEMOGRAPHIC_DATA = 'demographic_data',
  FINANCIAL_DATA = 'financial_data',
  HEALTH_DATA = 'health_data',
  BIOMETRIC_DATA = 'biometric_data',
  BEHAVIORAL_DATA = 'behavioral_data',
  TECHNICAL_DATA = 'technical_data',
  USAGE_DATA = 'usage_data',
  COMMUNICATION_DATA = 'communication_data',
  LOCATION_DATA = 'location_data',
  SPECIAL_CATEGORIES = 'special_categories'
}

export enum AccessLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  RESTRICTED = 'restricted',
  CONFIDENTIAL = 'confidential',
  TOP_SECRET = 'top_secret'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  UNDER_REVIEW = 'under_review',
  NEEDS_ATTENTION = 'needs_attention'
}

export interface PrivacyAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  username: string;
  action: PrivacyAction;
  dataType: string;
  dataId?: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export enum PrivacyAction {
  DATA_ACCESS = 'data_access',
  DATA_EXPORT = 'data_export',
  DATA_DELETION = 'data_deletion',
  DATA_MODIFICATION = 'data_modification',
  CONSENT_GRANTED = 'consent_granted',
  CONSENT_REVOKED = 'consent_revoked',
  PRIVACY_SETTINGS_CHANGED = 'privacy_settings_changed',
  DATA_BREACH_DETECTED = 'data_breach_detected',
  ENCRYPTION_APPLIED = 'encryption_applied',
  ANONYMIZATION_APPLIED = 'anonymization_applied'
}

export interface DataBreachIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'investigating' | 'contained' | 'resolved' | 'reported';
  detectedAt: Date;
  reportedAt?: Date;
  resolvedAt?: Date;
  affectedDataTypes: DataCategory[];
  affectedRecords: number;
  affectedUsers: string[];
  rootCause?: string;
  mitigationSteps: string[];
  regulatoryNotificationRequired: boolean;
  regulatoryNotificationSent?: boolean;
  regulatoryNotificationDate?: Date;
  userNotificationRequired: boolean;
  userNotificationSent?: boolean;
  userNotificationDate?: Date;
  assignedTo?: string;
  notes?: string;
  attachments?: string[];
}

export interface EncryptionKey {
  id: string;
  algorithm: string;
  keySize: number;
  purpose: string;
  createdAt: Date;
  expiresAt?: Date;
  rotatedAt?: Date;
  status: 'active' | 'expired' | 'revoked' | 'compromised';
  usageCount: number;
  lastUsedAt?: Date;
}

export interface DataAnonymizationRule {
  id: string;
  name: string;
  description: string;
  dataType: string;
  field: string;
  technique: AnonymizationTechnique;
  parameters: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  appliedCount: number;
  lastAppliedAt?: Date;
}

export enum AnonymizationTechnique {
  MASKING = 'masking',
  HASHING = 'hashing',
  TOKENIZATION = 'tokenization',
  GENERALIZATION = 'generalization',
  SUPPRESSION = 'suppression',
  NOISE_ADDITION = 'noise_addition',
  K_ANONYMITY = 'k_anonymity',
  L_DIVERSITY = 'l_diversity',
  T_CLOSENESS = 't_closeness'
}