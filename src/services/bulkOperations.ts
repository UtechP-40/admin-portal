import { apiService } from './api';
import type { 
  BulkOperation, 
  BulkOperationPreview, 
  OperationTemplate, 
  SavedQuery 
} from '../types/database';
import type { ApiResponse } from '../types/api';

export class BulkOperationsService {
  /**
   * Preview bulk operations before execution
   */
  static async previewBulkOperations(
    collection: string,
    operations: BulkOperation[]
  ): Promise<BulkOperationPreview[]> {
    const response = await apiService.post<ApiResponse<BulkOperationPreview[]>>(
      `/database/collections/${collection}/bulk/preview`,
      { operations }
    );
    return response.data.data;
  }

  /**
   * Execute bulk operations with transaction support
   */
  static async executeBulkOperations(
    collection: string,
    operations: BulkOperation[],
    options: {
      useTransaction?: boolean;
      dryRun?: boolean;
      continueOnError?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<{
    results: Array<{
      operation: BulkOperation;
      success: boolean;
      result?: any;
      error?: string;
      affectedCount: number;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      totalAffected: number;
    };
    executionTime: number;
  }> {
    const response = await apiService.post<ApiResponse<any>>(
      `/database/collections/${collection}/bulk/execute`,
      { operations, options }
    );
    return response.data.data;
  }

  /**
   * Analyze impact of bulk operations
   */
  static async analyzeOperationImpact(
    collection: string,
    operations: BulkOperation[]
  ): Promise<{
    estimatedAffectedDocuments: number;
    estimatedDataSizeChange: number;
    indexUpdatesRequired: number;
    cascadeEffects: Array<{
      collection: string;
      field: string;
      estimatedAffected: number;
    }>;
    performanceImpact: 'low' | 'medium' | 'high';
    warnings: string[];
    recommendations: string[];
  }> {
    const response = await apiService.post<ApiResponse<any>>(
      `/database/collections/${collection}/bulk/analyze`,
      { operations }
    );
    return response.data.data;
  }

  /**
   * Save operation template
   */
  static async saveOperationTemplate(
    template: Omit<OperationTemplate, 'id' | 'createdAt' | 'lastUsed' | 'useCount'>
  ): Promise<OperationTemplate> {
    const response = await apiService.post<ApiResponse<OperationTemplate>>(
      '/database/operation-templates',
      template
    );
    return response.data.data;
  }

  /**
   * Get operation templates
   */
  static async getOperationTemplates(
    collection?: string,
    tags?: string[]
  ): Promise<OperationTemplate[]> {
    const params = new URLSearchParams();
    if (collection) params.append('collection', collection);
    if (tags) tags.forEach(tag => params.append('tags', tag));

    const response = await apiService.get<ApiResponse<OperationTemplate[]>>(
      `/database/operation-templates?${params.toString()}`
    );
    return response.data.data;
  }

  /**
   * Update operation template
   */
  static async updateOperationTemplate(
    id: string,
    updates: Partial<OperationTemplate>
  ): Promise<OperationTemplate> {
    const response = await apiService.put<ApiResponse<OperationTemplate>>(
      `/database/operation-templates/${id}`,
      updates
    );
    return response.data.data;
  }

  /**
   * Delete operation template
   */
  static async deleteOperationTemplate(id: string): Promise<void> {
    await apiService.delete(`/database/operation-templates/${id}`);
  }

  /**
   * Save query for reuse
   */
  static async saveQuery(
    query: Omit<SavedQuery, 'id' | 'createdAt' | 'lastUsed' | 'useCount'>
  ): Promise<SavedQuery> {
    const response = await apiService.post<ApiResponse<SavedQuery>>(
      '/database/saved-queries',
      query
    );
    return response.data.data;
  }

  /**
   * Get saved queries
   */
  static async getSavedQueries(
    collection?: string,
    tags?: string[]
  ): Promise<SavedQuery[]> {
    const params = new URLSearchParams();
    if (collection) params.append('collection', collection);
    if (tags) tags.forEach(tag => params.append('tags', tag));

    const response = await apiService.get<ApiResponse<SavedQuery[]>>(
      `/database/saved-queries?${params.toString()}`
    );
    return response.data.data;
  }

  /**
   * Execute saved query
   */
  static async executeSavedQuery(
    id: string,
    options: {
      page?: number;
      limit?: number;
      additionalFilters?: any;
    } = {}
  ): Promise<{
    documents: any[];
    pagination: any;
    query: SavedQuery;
  }> {
    const response = await apiService.post<ApiResponse<any>>(
      `/database/saved-queries/${id}/execute`,
      options
    );
    return response.data.data;
  }

  /**
   * Generate operations from query results
   */
  static async generateOperationsFromQuery(
    collection: string,
    query: any,
    operationType: 'update' | 'delete',
    updateData?: any
  ): Promise<BulkOperation[]> {
    const response = await apiService.post<ApiResponse<BulkOperation[]>>(
      `/database/collections/${collection}/generate-operations`,
      {
        query,
        operationType,
        updateData
      }
    );
    return response.data.data;
  }

  /**
   * Validate bulk operations
   */
  static async validateBulkOperations(
    collection: string,
    operations: BulkOperation[]
  ): Promise<{
    valid: boolean;
    errors: Array<{
      operationIndex: number;
      field: string;
      message: string;
    }>;
    warnings: Array<{
      operationIndex: number;
      message: string;
    }>;
  }> {
    const response = await apiService.post<ApiResponse<any>>(
      `/database/collections/${collection}/bulk/validate`,
      { operations }
    );
    return response.data.data;
  }

  /**
   * Get bulk operation history
   */
  static async getBulkOperationHistory(
    collection?: string,
    limit = 50
  ): Promise<Array<{
    id: string;
    collection: string;
    operations: BulkOperation[];
    executedBy: string;
    executedAt: Date;
    results: any;
    duration: number;
  }>> {
    const params = new URLSearchParams();
    if (collection) params.append('collection', collection);
    params.append('limit', limit.toString());

    const response = await apiService.get<ApiResponse<any>>(
      `/database/bulk-operations/history?${params.toString()}`
    );
    return response.data.data;
  }

  /**
   * Rollback bulk operation (if supported)
   */
  static async rollbackBulkOperation(
    operationId: string
  ): Promise<{
    success: boolean;
    rolledBackCount: number;
    errors: string[];
  }> {
    const response = await apiService.post<ApiResponse<any>>(
      `/database/bulk-operations/${operationId}/rollback`
    );
    return response.data.data;
  }

  /**
   * Export operation results
   */
  static async exportOperationResults(
    operationId: string,
    format: 'json' | 'csv' | 'xlsx'
  ): Promise<Blob> {
    const response = await apiService.get(
      `/database/bulk-operations/${operationId}/export?format=${format}`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  /**
   * Schedule bulk operation for later execution
   */
  static async scheduleBulkOperation(
    collection: string,
    operations: BulkOperation[],
    scheduleOptions: {
      executeAt: Date;
      recurring?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        interval: number;
        endDate?: Date;
      };
      notifications?: {
        onSuccess: boolean;
        onFailure: boolean;
        emails: string[];
      };
    }
  ): Promise<{
    scheduleId: string;
    nextExecution: Date;
  }> {
    const response = await apiService.post<ApiResponse<any>>(
      `/database/collections/${collection}/bulk/schedule`,
      { operations, scheduleOptions }
    );
    return response.data.data;
  }

  /**
   * Get scheduled bulk operations
   */
  static async getScheduledOperations(): Promise<Array<{
    id: string;
    collection: string;
    operations: BulkOperation[];
    nextExecution: Date;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    createdBy: string;
    createdAt: Date;
  }>> {
    const response = await apiService.get<ApiResponse<any>>(
      '/database/bulk-operations/scheduled'
    );
    return response.data.data;
  }

  /**
   * Cancel scheduled bulk operation
   */
  static async cancelScheduledOperation(scheduleId: string): Promise<void> {
    await apiService.delete(`/database/bulk-operations/scheduled/${scheduleId}`);
  }

  /**
   * Format operation summary for display
   */
  static formatOperationSummary(operation: BulkOperation): string {
    switch (operation.operation) {
      case 'insert':
        return `Insert ${Array.isArray(operation.data) ? operation.data.length : 1} document(s)`;
      case 'update':
        const filterStr = operation.filter ? JSON.stringify(operation.filter) : 'all';
        return `Update documents matching ${filterStr}`;
      case 'delete':
        const deleteFilterStr = operation.filter ? JSON.stringify(operation.filter) : 'all';
        return `Delete documents matching ${deleteFilterStr}`;
      default:
        return 'Unknown operation';
    }
  }

  /**
   * Estimate operation execution time
   */
  static estimateExecutionTime(
    operations: BulkOperation[],
    collectionSize: number
  ): {
    estimatedSeconds: number;
    confidence: 'low' | 'medium' | 'high';
    factors: string[];
  } {
    let estimatedSeconds = 0;
    const factors: string[] = [];

    operations.forEach(op => {
      switch (op.operation) {
        case 'insert':
          const insertCount = Array.isArray(op.data) ? op.data.length : 1;
          estimatedSeconds += insertCount * 0.001; // 1ms per insert
          factors.push(`${insertCount} inserts`);
          break;
        case 'update':
          // Estimate based on filter complexity and collection size
          const updateEstimate = collectionSize * 0.0001; // 0.1ms per document to check
          estimatedSeconds += updateEstimate;
          factors.push('Update operation on collection');
          break;
        case 'delete':
          const deleteEstimate = collectionSize * 0.0001;
          estimatedSeconds += deleteEstimate;
          factors.push('Delete operation on collection');
          break;
      }
    });

    // Add overhead for transaction management
    if (operations.length > 1) {
      estimatedSeconds += 0.1; // 100ms transaction overhead
      factors.push('Transaction overhead');
    }

    return {
      estimatedSeconds: Math.max(estimatedSeconds, 0.01), // Minimum 10ms
      confidence: operations.length > 10 ? 'low' : collectionSize > 10000 ? 'medium' : 'high',
      factors
    };
  }
}