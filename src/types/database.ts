// Enhanced database types for task 6.1
export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  data: any;
  changes: DocumentChange[];
  createdBy: string;
  createdAt: Date;
  comment?: string;
}

export interface DocumentChange {
  field: string;
  operation: 'add' | 'update' | 'delete';
  oldValue?: any;
  newValue?: any;
  path: string;
}

export interface DocumentRelationship {
  field: string;
  targetCollection: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey: string;
  localKey: string;
  documents?: any[];
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'objectId';
  required: boolean;
  default?: any;
  enum?: string[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  ref?: string; // For ObjectId references
  validation?: {
    validator: string;
    message: string;
  };
  index?: boolean;
  unique?: boolean;
}

export interface DocumentSchema {
  collection: string;
  fields: Record<string, SchemaField>;
  relationships: DocumentRelationship[];
  indexes: Array<{
    name: string;
    fields: Record<string, 1 | -1>;
    unique?: boolean;
    sparse?: boolean;
  }>;
  virtuals: string[];
  methods: string[];
  statics: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  path: string;
}

export interface DocumentValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface BulkOperationPreview {
  operation: 'insert' | 'update' | 'delete';
  affectedCount: number;
  sampleDocuments: any[];
  estimatedImpact: {
    dataSize: number;
    indexUpdates: number;
    cascadeEffects: string[];
  };
  warnings: string[];
  errors: string[];
}

export interface OperationTemplate {
  id: string;
  name: string;
  description: string;
  collection: string;
  operations: BulkOperation[];
  tags: string[];
  createdBy: string;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

export interface SavedQuery {
  id: string;
  name: string;
  description: string;
  collection: string;
  query: any;
  sort?: any;
  limit?: number;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

export interface CollectionPerformanceMetrics {
  collection: string;
  metrics: {
    queryCount: number;
    avgQueryTime: number;
    slowQueries: Array<{
      query: any;
      duration: number;
      timestamp: Date;
    }>;
    indexUsage: Record<string, {
      hits: number;
      misses: number;
      efficiency: number;
    }>;
    documentGrowth: Array<{
      date: Date;
      count: number;
      size: number;
    }>;
  };
  recommendations: Array<{
    type: 'index' | 'query' | 'schema';
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    action: string;
  }>;
}

export interface DatabaseHealthScore {
  overall: number;
  categories: {
    performance: number;
    storage: number;
    indexing: number;
    queries: number;
  };
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    category: string;
    description: string;
    recommendation: string;
  }>;
  trends: {
    performance: 'improving' | 'stable' | 'degrading';
    storage: 'growing' | 'stable' | 'shrinking';
  };
}