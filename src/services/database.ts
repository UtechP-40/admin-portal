import { apiService } from './api';
import type {
  CollectionMetadata,
  CollectionStats,
  QueryBuilderOptions,
  BulkOperation,
  ExportOptions,
  RestoreResult,
  ApiResponse,
  PaginatedResponse
} from '../types/api';
import type {
  DocumentSchema,
  DocumentVersion,
  DocumentRelationship,
  DocumentValidationResult
} from '../types/database';

export class DatabaseService {
  /**
   * Get all collections with metadata
   */
  static async getCollections(): Promise<CollectionMetadata[]> {
    const response = await apiService.get<ApiResponse<CollectionMetadata[]>>('/database/collections');
    return response.data.data;
  }

  /**
   * Get documents from a specific collection
   */
  static async getCollectionDocuments(
    collectionName: string,
    options: {
      page?: number;
      limit?: number;
      sort?: any;
      filter?: any;
      select?: string;
      populate?: string | string[];
    } = {}
  ) {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sort) params.append('sort', JSON.stringify(options.sort));
    if (options.filter) params.append('filter', JSON.stringify(options.filter));
    if (options.select) params.append('select', options.select);
    if (options.populate) {
      const populate = Array.isArray(options.populate) ? options.populate : [options.populate];
      populate.forEach(p => params.append('populate', p));
    }

    const response = await apiService.get<any>(
      `/database/collections/${collectionName}?${params.toString()}`
    );
    
    return {
      documents: response.data.data,
      pagination: response.data.pagination
    };
  }

  /**
   * Create a new document
   */
  static async createDocument(collectionName: string, data: any) {
    const response = await apiService.post<ApiResponse<any>>(
      `/database/collections/${collectionName}`,
      data
    );
    return response.data.data;
  }

  /**
   * Update a document by ID
   */
  static async updateDocument(
    collectionName: string,
    documentId: string,
    data: any,
    upsert = false
  ) {
    const response = await apiService.put<ApiResponse<any>>(
      `/database/collections/${collectionName}/${documentId}?upsert=${upsert}`,
      data
    );
    return response.data.data;
  }

  /**
   * Delete a document by ID
   */
  static async deleteDocument(
    collectionName: string,
    documentId: string,
    hard = false
  ) {
    const response = await apiService.delete<ApiResponse<any>>(
      `/database/collections/${collectionName}/${documentId}?hard=${hard}`
    );
    return response.data.data;
  }

  /**
   * Perform bulk operations
   */
  static async bulkOperations(collectionName: string, operations: BulkOperation[]) {
    const response = await apiService.post<ApiResponse<any>>(
      `/database/collections/${collectionName}/bulk`,
      { operations }
    );
    return response.data.data;
  }

  /**
   * Execute aggregation pipeline
   */
  static async executeAggregation(collectionName: string, pipeline: any[]) {
    const response = await apiService.post<ApiResponse<any>>(
      `/database/collections/${collectionName}/aggregate`,
      { pipeline }
    );
    return response.data.data;
  }

  /**
   * Get collection statistics
   */
  static async getCollectionStats(collectionName: string): Promise<CollectionStats> {
    const response = await apiService.get<ApiResponse<CollectionStats>>(
      `/database/collections/${collectionName}/stats`
    );
    return response.data.data;
  }

  /**
   * Export collection data
   */
  static async exportCollection(
    collectionName: string,
    options: ExportOptions
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', options.format);
    if (options.filter) params.append('filter', JSON.stringify(options.filter));
    if (options.select) params.append('select', options.select);
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await apiService.get(
      `/database/collections/${collectionName}/export?${params.toString()}`,
      { responseType: 'blob' }
    );
    
    return response.data;
  }

  /**
   * Execute query builder
   */
  static async executeQuery(options: QueryBuilderOptions) {
    const response = await apiService.post<any>('/database/query-builder', options);
    return {
      documents: response.data.data,
      pagination: response.data.pagination
    };
  }

  /**
   * Create database backup
   */
  static async createBackup(collections?: string[]): Promise<Blob> {
    const response = await apiService.post(
      '/database/backup',
      { collections },
      { responseType: 'blob' }
    );
    return response.data;
  }

  /**
   * Restore database from backup
   */
  static async restoreBackup(
    backupFile: File,
    overwrite = false
  ): Promise<RestoreResult> {
    const formData = new FormData();
    formData.append('backup', backupFile);
    formData.append('overwrite', overwrite.toString());

    const response = await apiService.post<ApiResponse<RestoreResult>>(
      '/database/restore',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.data;
  }

  /**
   * Get collection field suggestions for query builder
   */
  static getFieldSuggestions(schema: any): string[] {
    if (!schema?.fields) return [];
    return Object.keys(schema.fields);
  }

  /**
   * Validate MongoDB query
   */
  static validateQuery(query: any): { valid: boolean; error?: string } {
    try {
      if (typeof query !== 'object' || query === null) {
        return { valid: false, error: 'Query must be an object' };
      }
      
      // Basic validation - check for dangerous operations
      const queryStr = JSON.stringify(query);
      const dangerousPatterns = ['$where', 'eval', 'function'];
      
      for (const pattern of dangerousPatterns) {
        if (queryStr.includes(pattern)) {
          return { valid: false, error: `Dangerous operation detected: ${pattern}` };
        }
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  }

  /**
   * Format document size
   */
  static formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format document count
   */
  static formatCount(count: number): string {
    if (count < 1000) return count.toString();
    if (count < 1000000) return (count / 1000).toFixed(1) + 'K';
    return (count / 1000000).toFixed(1) + 'M';
  }

  /**
   * Get document schema with enhanced metadata
   */
  static async getDocumentSchema(collectionName: string): Promise<DocumentSchema> {
    const response = await apiService.get<ApiResponse<DocumentSchema>>(
      `/database/collections/${collectionName}/schema`
    );
    return response.data.data;
  }

  /**
   * Update document with versioning support
   */
  static async updateDocumentWithVersioning(
    collectionName: string,
    documentId: string,
    data: any,
    comment?: string
  ) {
    const response = await apiService.put<ApiResponse<any>>(
      `/database/collections/${collectionName}/${documentId}/versioned`,
      { data, comment }
    );
    return response.data.data;
  }

  /**
   * Create document with versioning support
   */
  static async createDocumentWithVersioning(
    collectionName: string,
    data: any,
    comment?: string
  ) {
    const response = await apiService.post<ApiResponse<any>>(
      `/database/collections/${collectionName}/versioned`,
      { data, comment }
    );
    return response.data.data;
  }

  /**
   * Validate document against schema
   */
  static async validateDocument(
    collectionName: string,
    data: any
  ): Promise<DocumentValidationResult> {
    const response = await apiService.post<ApiResponse<DocumentValidationResult>>(
      `/database/collections/${collectionName}/validate`,
      { data }
    );
    return response.data.data;
  }

  /**
   * Get document with relationships populated
   */
  static async getDocumentWithRelationships(
    collectionName: string,
    documentId: string,
    populateDepth = 1
  ) {
    const response = await apiService.get<ApiResponse<any>>(
      `/database/collections/${collectionName}/${documentId}?populate=true&depth=${populateDepth}`
    );
    return response.data.data;
  }

  /**
   * Search documents with advanced filtering
   */
  static async searchDocuments(
    collectionName: string,
    searchOptions: {
      query?: string;
      fields?: string[];
      filters?: Record<string, any>;
      sort?: Record<string, 1 | -1>;
      page?: number;
      limit?: number;
      fuzzy?: boolean;
    }
  ) {
    const response = await apiService.post<any>(
      `/database/collections/${collectionName}/search`,
      searchOptions
    );
    return {
      documents: response.data.data,
      pagination: response.data.pagination,
      facets: response.data.facets
    };
  }

  /**
   * Get field statistics for a collection
   */
  static async getFieldStatistics(
    collectionName: string,
    fieldName: string
  ): Promise<{
    field: string;
    type: string;
    uniqueValues: number;
    nullCount: number;
    distribution: Array<{ value: any; count: number }>;
    min?: any;
    max?: any;
    avg?: number;
  }> {
    const response = await apiService.get<ApiResponse<any>>(
      `/database/collections/${collectionName}/fields/${fieldName}/stats`
    );
    return response.data.data;
  }

  /**
   * Suggest field values based on existing data
   */
  static async suggestFieldValues(
    collectionName: string,
    fieldName: string,
    query?: string,
    limit = 10
  ): Promise<string[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    params.append('limit', limit.toString());

    const response = await apiService.get<ApiResponse<string[]>>(
      `/database/collections/${collectionName}/fields/${fieldName}/suggest?${params.toString()}`
    );
    return response.data.data;
  }
}