import { apiService } from './api';
import type { 
  CollectionPerformanceMetrics, 
  DatabaseHealthScore 
} from '../types/database';
import type { ApiResponse } from '../types/api';

export class DatabaseMonitoringService {
  /**
   * Get real-time performance metrics for a collection
   */
  static async getCollectionPerformanceMetrics(
    collection: string,
    timeRange: {
      startDate: Date;
      endDate: Date;
      granularity: 'minute' | 'hour' | 'day';
    }
  ): Promise<CollectionPerformanceMetrics> {
    const params = new URLSearchParams();
    params.append('startDate', timeRange.startDate.toISOString());
    params.append('endDate', timeRange.endDate.toISOString());
    params.append('granularity', timeRange.granularity);

    const response = await apiService.get<ApiResponse<CollectionPerformanceMetrics>>(
      `/database/collections/${collection}/performance?${params.toString()}`
    );
    return response.data.data;
  }

  /**
   * Get database health score
   */
  static async getDatabaseHealthScore(): Promise<DatabaseHealthScore> {
    const response = await apiService.get<ApiResponse<DatabaseHealthScore>>(
      '/database/health'
    );
    return response.data.data;
  }

  /**
   * Get index optimization recommendations
   */
  static async getIndexOptimizationRecommendations(
    collection?: string
  ): Promise<Array<{
    collection: string;
    recommendation: {
      type: 'create' | 'drop' | 'modify';
      index: {
        fields: Record<string, 1 | -1>;
        options?: any;
      };
      reason: string;
      impact: 'high' | 'medium' | 'low';
      estimatedImprovement: string;
    };
  }>> {
    const params = new URLSearchParams();
    if (collection) params.append('collection', collection);

    const response = await apiService.get<ApiResponse<any>>(
      `/database/index-recommendations?${params.toString()}`
    );
    return response.data.data;
  }

  /**
   * Get slow query analysis
   */
  static async getSlowQueryAnalysis(
    collection?: string,
    limit = 50
  ): Promise<Array<{
    collection: string;
    query: any;
    duration: number;
    timestamp: Date;
    executionStats: {
      totalDocsExamined: number;
      totalDocsReturned: number;
      indexesUsed: string[];
      stage: string;
    };
    recommendation?: string;
  }>> {
    const params = new URLSearchParams();
    if (collection) params.append('collection', collection);
    params.append('limit', limit.toString());

    const response = await apiService.get<ApiResponse<any>>(
      `/database/slow-queries?${params.toString()}`
    );
    return response.data.data;
  }

  /**
   * Get real-time database metrics
   */
  static async getRealTimeMetrics(): Promise<{
    connections: {
      current: number;
      available: number;
      totalCreated: number;
    };
    operations: {
      insert: number;
      query: number;
      update: number;
      delete: number;
      getmore: number;
      command: number;
    };
    memory: {
      resident: number;
      virtual: number;
      mapped: number;
    };
    network: {
      bytesIn: number;
      bytesOut: number;
      numRequests: number;
    };
    locks: {
      globalLock: {
        currentQueue: {
          total: number;
          readers: number;
          writers: number;
        };
        activeClients: {
          total: number;
          readers: number;
          writers: number;
        };
      };
    };
    timestamp: Date;
  }> {
    const response = await apiService.get<ApiResponse<any>>('/database/metrics/realtime');
    return response.data.data;
  }

  /**
   * Get collection storage statistics
   */
  static async getCollectionStorageStats(collection: string): Promise<{
    collection: string;
    stats: {
      size: number;
      count: number;
      avgObjSize: number;
      storageSize: number;
      totalIndexSize: number;
      indexSizes: Record<string, number>;
      capped: boolean;
      wiredTiger?: {
        creationString: string;
        type: string;
        uri: string;
        LSM: any;
        'block-manager': any;
        btree: any;
        cache: any;
        compression: any;
        cursor: any;
        reconciliation: any;
        session: any;
        transaction: any;
      };
    };
    indexes: Array<{
      name: string;
      key: Record<string, 1 | -1>;
      unique?: boolean;
      sparse?: boolean;
      partialFilterExpression?: any;
      expireAfterSeconds?: number;
      size: number;
      usageStats: {
        ops: number;
        since: Date;
      };
    }>;
    sharding?: {
      sharded: boolean;
      shardKey?: Record<string, 1 | -1>;
      chunks?: number;
      balancerEnabled?: boolean;
    };
  }> {
    const response = await apiService.get<ApiResponse<any>>(
      `/database/collections/${collection}/storage-stats`
    );
    return response.data.data;
  }

  /**
   * Get query performance insights
   */
  static async getQueryPerformanceInsights(
    collection: string,
    timeRange: {
      startDate: Date;
      endDate: Date;
    }
  ): Promise<{
    collection: string;
    timeRange: { startDate: Date; endDate: Date };
    insights: {
      totalQueries: number;
      avgExecutionTime: number;
      slowestQueries: Array<{
        query: any;
        executionTime: number;
        timestamp: Date;
      }>;
      mostFrequentQueries: Array<{
        queryPattern: string;
        count: number;
        avgExecutionTime: number;
      }>;
      indexUsage: Array<{
        index: string;
        hitCount: number;
        missCount: number;
        efficiency: number;
      }>;
      recommendations: Array<{
        type: 'index' | 'query' | 'schema';
        priority: 'high' | 'medium' | 'low';
        description: string;
        impact: string;
      }>;
    };
  }> {
    const params = new URLSearchParams();
    params.append('startDate', timeRange.startDate.toISOString());
    params.append('endDate', timeRange.endDate.toISOString());

    const response = await apiService.get<ApiResponse<any>>(
      `/database/collections/${collection}/query-insights?${params.toString()}`
    );
    return response.data.data;
  }

  /**
   * Create performance alert
   */
  static async createPerformanceAlert(alert: {
    name: string;
    description: string;
    collection?: string;
    metric: 'query_time' | 'index_usage' | 'storage_size' | 'connection_count';
    threshold: {
      operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
      value: number;
    };
    duration: number; // minutes
    notifications: {
      email: string[];
      webhook?: string;
    };
    enabled: boolean;
  }): Promise<{
    id: string;
    alert: any;
  }> {
    const response = await apiService.post<ApiResponse<any>>(
      '/database/alerts',
      alert
    );
    return response.data.data;
  }

  /**
   * Get performance alerts
   */
  static async getPerformanceAlerts(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    collection?: string;
    metric: string;
    threshold: any;
    status: 'active' | 'triggered' | 'disabled';
    lastTriggered?: Date;
    createdAt: Date;
  }>> {
    const response = await apiService.get<ApiResponse<any>>('/database/alerts');
    return response.data.data;
  }

  /**
   * Update performance alert
   */
  static async updatePerformanceAlert(
    id: string,
    updates: Partial<any>
  ): Promise<void> {
    await apiService.put(`/database/alerts/${id}`, updates);
  }

  /**
   * Delete performance alert
   */
  static async deletePerformanceAlert(id: string): Promise<void> {
    await apiService.delete(`/database/alerts/${id}`);
  }

  /**
   * Get database profiling data
   */
  static async getProfilingData(
    collection?: string,
    options: {
      minExecutionTime?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<Array<{
    ts: Date;
    t: {
      $date: string;
    };
    ns: string;
    op: string;
    command?: any;
    keysExamined: number;
    docsExamined: number;
    nreturned: number;
    responseLength: number;
    millis: number;
    execStats?: any;
    planSummary: string;
    user?: string;
    client: string;
  }>> {
    const params = new URLSearchParams();
    if (collection) params.append('collection', collection);
    if (options.minExecutionTime) params.append('minExecutionTime', options.minExecutionTime.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.startDate) params.append('startDate', options.startDate.toISOString());
    if (options.endDate) params.append('endDate', options.endDate.toISOString());

    const response = await apiService.get<ApiResponse<any>>(
      `/database/profiling?${params.toString()}`
    );
    return response.data.data;
  }

  /**
   * Enable/disable database profiling
   */
  static async setProfilingLevel(
    level: 0 | 1 | 2, // 0: off, 1: slow operations, 2: all operations
    slowMs?: number
  ): Promise<void> {
    await apiService.post('/database/profiling/level', {
      level,
      slowMs
    });
  }

  /**
   * Get database replication status
   */
  static async getReplicationStatus(): Promise<{
    ismaster: boolean;
    secondary: boolean;
    hosts: string[];
    primary?: string;
    me: string;
    maxBsonObjectSize: number;
    maxMessageSizeBytes: number;
    maxWriteBatchSize: number;
    localTime: Date;
    logicalSessionTimeoutMinutes: number;
    minWireVersion: number;
    maxWireVersion: number;
    readOnly: boolean;
    ok: number;
    operationTime?: any;
    $clusterTime?: any;
  }> {
    const response = await apiService.get<ApiResponse<any>>('/database/replication/status');
    return response.data.data;
  }

  /**
   * Format bytes for display
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration for display
   */
  static formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    if (milliseconds < 3600000) return `${(milliseconds / 60000).toFixed(1)}m`;
    return `${(milliseconds / 3600000).toFixed(1)}h`;
  }

  /**
   * Calculate health score color
   */
  static getHealthScoreColor(score: number): 'success' | 'warning' | 'error' {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  }

  /**
   * Get performance trend
   */
  static getPerformanceTrend(
    current: number,
    previous: number
  ): { trend: 'up' | 'down' | 'stable'; percentage: number } {
    if (previous === 0) return { trend: 'stable', percentage: 0 };
    
    const percentage = ((current - previous) / previous) * 100;
    const threshold = 5; // 5% threshold for stability
    
    if (Math.abs(percentage) < threshold) {
      return { trend: 'stable', percentage: 0 };
    }
    
    return {
      trend: percentage > 0 ? 'up' : 'down',
      percentage: Math.abs(percentage)
    };
  }
}