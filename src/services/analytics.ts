import { apiService } from './api';

export interface DashboardMetricsOptions {
  startDate: Date;
  endDate: Date;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  timezone?: string;
}

export interface AnalyticsQueryBuilder {
  collection: string;
  filters: Record<string, any>;
  aggregation?: any[];
  groupBy?: string[];
  sortBy?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  filename?: string;
  includeMetadata?: boolean;
  compression?: boolean;
}

export interface LogStreamOptions {
  level?: string;
  category?: string;
  startTime?: Date;
  endTime?: Date;
  follow?: boolean;
  maxLines?: number;
}

export interface DashboardMetrics {
  overview: {
    totalEvents: number;
    uniqueUsers: number;
    activeUsers: number;
    errorRate: number;
    avgResponseTime: number;
    systemUptime: number;
  };
  games: any;
  errors: any;
  performance: any;
  engagement: any;
  system: any;
  timeRange: {
    startDate: Date;
    endDate: Date;
    granularity: string;
  };
  generatedAt: Date;
}

export interface TimeBasedAggregation {
  current: any[];
  previous?: any[];
  comparison?: {
    change: number;
    percentChange: number;
    trend: 'up' | 'down' | 'stable';
  };
  period: {
    startDate: Date;
    endDate: Date;
    granularity: string;
  };
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  source: string;
  correlationId?: string;
  userId?: string;
  metadata?: any;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  notificationChannels: string[];
}

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  schedule: string;
  reportType: string;
  parameters: any;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export const analyticsService = {
  // Dashboard metrics
  async getDashboardMetrics(options: DashboardMetricsOptions): Promise<DashboardMetrics> {
    const response = await apiService.post<DashboardMetrics>('/admin/analytics/dashboard', options);
    return response.data;
  },

  // Custom queries
  async executeCustomQuery(queryBuilder: AnalyticsQueryBuilder): Promise<any> {
    const response = await apiService.post('/admin/analytics/query', queryBuilder);
    return response.data;
  },

  // Time-based aggregations
  async getTimeBasedAggregation(
    collection: string,
    metric: string,
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day',
    compareWithPrevious: boolean = false
  ): Promise<TimeBasedAggregation> {
    const response = await apiService.post<TimeBasedAggregation>('/admin/analytics/aggregation', {
      collection,
      metric,
      startDate,
      endDate,
      granularity,
      compareWithPrevious
    });
    return response.data;
  },

  // Data export
  async exportAnalyticsData(
    collection: string,
    filters: Record<string, any>,
    options: ExportOptions
  ): Promise<{ filePath: string; metadata: any }> {
    const response = await apiService.post('/admin/analytics/export', {
      collection,
      filters,
      options
    });
    return response.data;
  },

  // User analytics
  async getUserAnalytics(startDate: Date, endDate: Date): Promise<any> {
    const response = await apiService.post('/admin/analytics/users', {
      startDate,
      endDate
    });
    return response.data;
  },

  // Game analytics
  async getGameAnalytics(startDate: Date, endDate: Date): Promise<any> {
    const response = await apiService.post('/admin/analytics/games', {
      startDate,
      endDate
    });
    return response.data;
  },

  // System performance analytics
  async getSystemPerformance(startDate: Date, endDate: Date): Promise<any> {
    const response = await apiService.post('/admin/analytics/system', {
      startDate,
      endDate
    });
    return response.data;
  },

  // Logging
  async getLogs(options: LogStreamOptions): Promise<LogEntry[]> {
    const response = await apiService.post<LogEntry[]>('/admin/logs', options);
    return response.data;
  },

  async downloadLogFile(filename: string, compress: boolean = false): Promise<string> {
    const response = await apiService.post<{ filePath: string }>('/admin/logs/download', {
      filename,
      compress
    });
    return response.data.filePath;
  },

  async searchLogs(query: string, options: LogStreamOptions): Promise<LogEntry[]> {
    const response = await apiService.post<LogEntry[]>('/admin/logs/search', {
      query,
      ...options
    });
    return response.data;
  },

  // Real-time log streaming
  async streamLogs(options: LogStreamOptions, onMessage: (log: LogEntry) => void): Promise<EventSource> {
    const params = new URLSearchParams();
    if (options.level) params.append('level', options.level);
    if (options.category) params.append('category', options.category);
    if (options.startTime) params.append('startTime', options.startTime.toISOString());
    if (options.endTime) params.append('endTime', options.endTime.toISOString());
    if (options.maxLines) params.append('maxLines', options.maxLines.toString());

    const eventSource = new EventSource(`/api/admin/logs/stream?${params.toString()}`);
    
    eventSource.onmessage = (event) => {
      try {
        const logEntry = JSON.parse(event.data);
        onMessage(logEntry);
      } catch (error) {
        console.error('Failed to parse log entry:', error);
      }
    };

    return eventSource;
  },

  // Alerts and monitoring
  async getAlertRules(): Promise<AlertRule[]> {
    const response = await apiService.get<AlertRule[]>('/admin/alerts/rules');
    return response.data;
  },

  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    const response = await apiService.post<AlertRule>('/admin/alerts/rules', rule);
    return response.data;
  },

  async updateAlertRule(id: string, rule: Partial<AlertRule>): Promise<AlertRule> {
    const response = await apiService.put<AlertRule>(`/admin/alerts/rules/${id}`, rule);
    return response.data;
  },

  async deleteAlertRule(id: string): Promise<void> {
    await apiService.delete(`/admin/alerts/rules/${id}`);
  },

  async testAlertRule(id: string): Promise<any> {
    const response = await apiService.post(`/admin/alerts/rules/${id}/test`);
    return response.data;
  },

  // Scheduled reports
  async getScheduledReports(): Promise<ScheduledReport[]> {
    const response = await apiService.get<ScheduledReport[]>('/admin/reports/scheduled');
    return response.data;
  },

  async createScheduledReport(report: Omit<ScheduledReport, 'id'>): Promise<ScheduledReport> {
    const response = await apiService.post<ScheduledReport>('/admin/reports/scheduled', report);
    return response.data;
  },

  async updateScheduledReport(id: string, report: Partial<ScheduledReport>): Promise<ScheduledReport> {
    const response = await apiService.put<ScheduledReport>(`/admin/reports/scheduled/${id}`, report);
    return response.data;
  },

  async deleteScheduledReport(id: string): Promise<void> {
    await apiService.delete(`/admin/reports/scheduled/${id}`);
  },

  async runScheduledReport(id: string): Promise<any> {
    const response = await apiService.post(`/admin/reports/scheduled/${id}/run`);
    return response.data;
  },

  // Data visualization helpers
  async getVisualizationData(type: string, parameters: any): Promise<any> {
    const response = await apiService.post('/admin/analytics/visualization', {
      type,
      parameters
    });
    return response.data;
  },

  // Cache management
  async clearAnalyticsCache(tag?: string): Promise<void> {
    await apiService.post('/admin/analytics/cache/clear', { tag });
  },

  // Health check
  async getAnalyticsHealth(): Promise<any> {
    const response = await apiService.get('/admin/analytics/health');
    return response.data;
  },

  // Custom dashboard methods
  async getCustomDashboards(): Promise<any[]> {
    const response = await apiService.get('/admin/dashboards');
    return response.data;
  },

  async saveDashboard(dashboard: any): Promise<any> {
    if (dashboard.id && dashboard.id.startsWith('dashboard_')) {
      // Create new dashboard
      const response = await apiService.post('/admin/dashboards', dashboard);
      return response.data;
    } else {
      // Update existing dashboard
      const response = await apiService.put(`/admin/dashboards/${dashboard.id}`, dashboard);
      return response.data;
    }
  },

  async deleteDashboard(id: string): Promise<void> {
    await apiService.delete(`/admin/dashboards/${id}`);
  },

  // Report builder methods
  async getReports(): Promise<any[]> {
    const response = await apiService.get('/admin/reports');
    return response.data;
  },

  async getReport(id: string): Promise<any> {
    const response = await apiService.get(`/admin/reports/${id}`);
    return response.data;
  },

  async saveReport(report: any): Promise<any> {
    if (report.id && report.id.startsWith('report_')) {
      // Create new report
      const response = await apiService.post('/admin/reports', report);
      return response.data;
    } else {
      // Update existing report
      const response = await apiService.put(`/admin/reports/${report.id}`, report);
      return response.data;
    }
  },

  async deleteReport(id: string): Promise<void> {
    await apiService.delete(`/admin/reports/${id}`);
  },

  async executeReport(id: string, parameters?: any): Promise<any> {
    const response = await apiService.post(`/admin/reports/${id}/execute`, parameters);
    return response.data;
  },

  // Advanced visualization methods
  async getChartData(config: any): Promise<any> {
    const response = await apiService.post('/admin/analytics/chart-data', config);
    return response.data;
  },

  async exportChart(config: any, format: 'png' | 'svg' | 'pdf'): Promise<string> {
    const response = await apiService.post('/admin/analytics/export-chart', {
      config,
      format,
    });
    return response.data.filePath;
  },

  // Export jobs methods
  async getExportJobs(): Promise<any[]> {
    const response = await apiService.get('/admin/exports/jobs');
    return response.data;
  },

  // Share links methods
  async getShareLinks(): Promise<any[]> {
    const response = await apiService.get('/admin/shares');
    return response.data;
  },

  async createShareLink(shareData: any): Promise<any> {
    const response = await apiService.post('/admin/shares', shareData);
    return response.data;
  }
};

export default analyticsService;