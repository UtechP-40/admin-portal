// Common API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Common query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  filters?: Record<string, any>;
}

export type QueryParams = PaginationParams & SortParams & FilterParams;

// Database types
export interface CollectionMetadata {
  name: string;
  count: number;
  size: number;
  avgObjSize: number;
  indexes: string[];
  schema?: {
    fields: Record<string, {
      type: string;
      required: boolean;
      default?: any;
      enum?: string[];
    }>;
    indexes: any[];
    virtuals: string[];
  };
}

export interface CollectionStats {
  name: string;
  stats: {
    count: number;
    size: number;
    avgObjSize: number;
    storageSize: number;
    totalIndexSize: number;
    indexSizes: Record<string, number>;
  };
  indexes: Array<{
    name: string;
    spec: any;
    size: number;
  }>;
  schema: any;
  sampleDocument: any;
}

export interface QueryBuilderOptions {
  collection: string;
  filter?: any;
  sort?: any;
  limit?: number;
  skip?: number;
  select?: string;
  populate?: string | string[];
}

export interface BulkOperation {
  operation: 'insert' | 'update' | 'delete';
  filter?: any;
  data?: any;
  upsert?: boolean;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  filter?: any;
  select?: string;
  limit?: number;
}

export interface BackupResult {
  data: Blob;
  filename: string;
  mimeType: string;
}

export interface RestoreResult {
  [collectionName: string]: {
    inserted: number;
    skipped: number;
  };
}
