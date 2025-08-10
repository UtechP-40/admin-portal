import { analyticsService } from './analytics';
import { ReportDefinition } from '../components/analytics/ReportBuilder';

export interface ScheduledReportExecution {
  id: string;
  reportId: string;
  scheduledAt: Date;
  executedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: {
    filePath?: string;
    recordCount?: number;
    error?: string;
  };
  recipients: string[];
  format: 'pdf' | 'html' | 'csv';
}

export interface ReportScheduleConfig {
  id: string;
  reportId: string;
  name: string;
  enabled: boolean;
  cron: string;
  recipients: string[];
  format: 'pdf' | 'html' | 'csv';
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class ReportSchedulingService {
  private schedules: Map<string, ReportScheduleConfig> = new Map();
  private executions: Map<string, ScheduledReportExecution> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  // Schedule management
  async createSchedule(config: Omit<ReportScheduleConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportScheduleConfig> {
    const schedule: ReportScheduleConfig = {
      ...config,
      id: `schedule_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      nextRun: this.calculateNextRun(config.cron),
    };

    this.schedules.set(schedule.id, schedule);
    
    if (schedule.enabled) {
      this.scheduleNextExecution(schedule);
    }

    // Save to backend
    await this.saveSchedule(schedule);
    
    return schedule;
  }

  async updateSchedule(id: string, updates: Partial<ReportScheduleConfig>): Promise<ReportScheduleConfig> {
    const existing = this.schedules.get(id);
    if (!existing) {
      throw new Error(`Schedule ${id} not found`);
    }

    const updated: ReportScheduleConfig = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date(),
    };

    // Recalculate next run if cron changed
    if (updates.cron && updates.cron !== existing.cron) {
      updated.nextRun = this.calculateNextRun(updates.cron);
    }

    this.schedules.set(id, updated);

    // Update timer
    this.clearTimer(id);
    if (updated.enabled) {
      this.scheduleNextExecution(updated);
    }

    // Save to backend
    await this.saveSchedule(updated);

    return updated;
  }

  async deleteSchedule(id: string): Promise<void> {
    this.clearTimer(id);
    this.schedules.delete(id);
    
    // Delete from backend
    await this.deleteScheduleFromBackend(id);
  }

  async getSchedules(): Promise<ReportScheduleConfig[]> {
    // Load from backend if empty
    if (this.schedules.size === 0) {
      await this.loadSchedulesFromBackend();
    }
    
    return Array.from(this.schedules.values());
  }

  async getSchedule(id: string): Promise<ReportScheduleConfig | null> {
    return this.schedules.get(id) || null;
  }

  // Execution management
  async executeReport(reportId: string, format: 'pdf' | 'html' | 'csv', recipients: string[]): Promise<ScheduledReportExecution> {
    const execution: ScheduledReportExecution = {
      id: `execution_${Date.now()}`,
      reportId,
      scheduledAt: new Date(),
      status: 'pending',
      recipients,
      format,
    };

    this.executions.set(execution.id, execution);

    try {
      // Update status to running
      execution.status = 'running';
      execution.executedAt = new Date();
      this.executions.set(execution.id, execution);

      // Load report definition
      const report = await this.loadReportDefinition(reportId);
      if (!report) {
        throw new Error(`Report ${reportId} not found`);
      }

      // Execute report query
      const data = await this.executeReportQuery(report);
      
      // Generate report file
      const filePath = await this.generateReportFile(report, data, format);
      
      // Send to recipients
      await this.sendReportToRecipients(report, filePath, recipients, format);

      // Update execution status
      execution.status = 'completed';
      execution.result = {
        filePath,
        recordCount: data.length,
      };

    } catch (error) {
      execution.status = 'failed';
      execution.result = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      console.error('Report execution failed:', error);
    }

    this.executions.set(execution.id, execution);
    return execution;
  }

  async getExecutions(reportId?: string): Promise<ScheduledReportExecution[]> {
    const executions = Array.from(this.executions.values());
    return reportId 
      ? executions.filter(e => e.reportId === reportId)
      : executions;
  }

  async getExecution(id: string): Promise<ScheduledReportExecution | null> {
    return this.executions.get(id) || null;
  }

  // Scheduling logic
  private scheduleNextExecution(schedule: ReportScheduleConfig): void {
    if (!schedule.nextRun) return;

    const delay = schedule.nextRun.getTime() - Date.now();
    if (delay <= 0) {
      // Should run now
      this.executeScheduledReport(schedule);
      return;
    }

    const timer = setTimeout(() => {
      this.executeScheduledReport(schedule);
    }, delay);

    this.timers.set(schedule.id, timer);
  }

  private async executeScheduledReport(schedule: ReportScheduleConfig): Promise<void> {
    try {
      // Execute the report
      await this.executeReport(schedule.reportId, schedule.format, schedule.recipients);

      // Update last run and calculate next run
      const updated = {
        ...schedule,
        lastRun: new Date(),
        nextRun: this.calculateNextRun(schedule.cron),
        updatedAt: new Date(),
      };

      this.schedules.set(schedule.id, updated);
      await this.saveSchedule(updated);

      // Schedule next execution
      if (updated.enabled) {
        this.scheduleNextExecution(updated);
      }

    } catch (error) {
      console.error(`Failed to execute scheduled report ${schedule.id}:`, error);
      
      // Still schedule next execution even if this one failed
      const updated = {
        ...schedule,
        nextRun: this.calculateNextRun(schedule.cron),
        updatedAt: new Date(),
      };

      this.schedules.set(schedule.id, updated);
      await this.saveSchedule(updated);

      if (updated.enabled) {
        this.scheduleNextExecution(updated);
      }
    }
  }

  private calculateNextRun(cron: string): Date {
    // Simple cron parser for common patterns
    // In a real implementation, you'd use a proper cron library
    const now = new Date();
    const next = new Date(now);

    switch (cron) {
      case '0 9 * * *': // Daily at 9 AM
        next.setHours(9, 0, 0, 0);
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;
      
      case '0 9 * * 1': // Weekly on Monday at 9 AM
        next.setHours(9, 0, 0, 0);
        const daysUntilMonday = (1 - next.getDay() + 7) % 7;
        if (daysUntilMonday === 0 && next <= now) {
          next.setDate(next.getDate() + 7);
        } else {
          next.setDate(next.getDate() + daysUntilMonday);
        }
        break;
      
      case '0 9 1 * *': // Monthly on 1st at 9 AM
        next.setHours(9, 0, 0, 0);
        next.setDate(1);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        break;
      
      case '0 9 1 1,4,7,10 *': // Quarterly at 9 AM
        next.setHours(9, 0, 0, 0);
        next.setDate(1);
        const currentMonth = next.getMonth();
        const quarterlyMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
        const nextQuarterMonth = quarterlyMonths.find(m => m > currentMonth) || quarterlyMonths[0];
        
        if (nextQuarterMonth <= currentMonth) {
          next.setFullYear(next.getFullYear() + 1);
        }
        next.setMonth(nextQuarterMonth);
        break;
      
      default:
        // Default to daily
        next.setHours(9, 0, 0, 0);
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
    }

    return next;
  }

  private clearTimer(scheduleId: string): void {
    const timer = this.timers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(scheduleId);
    }
  }

  // Report execution helpers
  private async loadReportDefinition(reportId: string): Promise<ReportDefinition | null> {
    try {
      // In a real implementation, this would load from the backend
      // For now, return a mock report
      return {
        id: reportId,
        name: 'Sample Report',
        description: 'A sample report',
        dataSources: ['events'],
        fields: [
          { id: 'timestamp', name: 'timestamp', type: 'date', source: 'events' },
          { id: 'count', name: 'count', type: 'number', source: 'events', aggregation: 'count' },
        ],
        filters: [],
        visualizations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to load report definition:', error);
      return null;
    }
  }

  private async executeReportQuery(report: ReportDefinition): Promise<any[]> {
    try {
      // Build query from report definition
      const query = {
        collection: report.dataSources[0] || 'events',
        filters: report.filters.reduce((acc, filter) => {
          acc[filter.field] = { [filter.operator]: filter.value };
          return acc;
        }, {} as any),
        aggregation: report.fields
          .filter(f => f.aggregation)
          .map(f => ({
            $group: {
              _id: null,
              [f.id]: { [`$${f.aggregation}`]: `$${f.name}` },
            },
          })),
        limit: 10000, // Reasonable limit for scheduled reports
      };

      const data = await analyticsService.executeCustomQuery(query);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('Failed to execute report query:', error);
      throw error;
    }
  }

  private async generateReportFile(
    report: ReportDefinition,
    data: any[],
    format: 'pdf' | 'html' | 'csv'
  ): Promise<string> {
    try {
      const exportResult = await analyticsService.exportAnalyticsData(
        report.dataSources[0] || 'events',
        {},
        {
          format: format as any,
          filename: `${report.name}_${new Date().toISOString().split('T')[0]}`,
          includeMetadata: true,
        }
      );

      return exportResult.filePath;
    } catch (error) {
      console.error('Failed to generate report file:', error);
      throw error;
    }
  }

  private async sendReportToRecipients(
    report: ReportDefinition,
    filePath: string,
    recipients: string[],
    format: string
  ): Promise<void> {
    try {
      // In a real implementation, this would send emails with the report attached
      console.log(`Sending report "${report.name}" (${format}) to:`, recipients);
      console.log(`Report file: ${filePath}`);
      
      // Mock email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to send report to recipients:', error);
      throw error;
    }
  }

  // Backend integration
  private async saveSchedule(schedule: ReportScheduleConfig): Promise<void> {
    try {
      // In a real implementation, this would save to the backend
      console.log('Saving schedule:', schedule.id);
    } catch (error) {
      console.error('Failed to save schedule:', error);
      throw error;
    }
  }

  private async deleteScheduleFromBackend(id: string): Promise<void> {
    try {
      // In a real implementation, this would delete from the backend
      console.log('Deleting schedule:', id);
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      throw error;
    }
  }

  private async loadSchedulesFromBackend(): Promise<void> {
    try {
      // In a real implementation, this would load from the backend
      console.log('Loading schedules from backend');
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  }

  // Utility methods
  getCronDescription(cron: string): string {
    switch (cron) {
      case '0 9 * * *':
        return 'Daily at 9:00 AM';
      case '0 9 * * 1':
        return 'Weekly on Monday at 9:00 AM';
      case '0 9 1 * *':
        return 'Monthly on the 1st at 9:00 AM';
      case '0 9 1 1,4,7,10 *':
        return 'Quarterly (Jan, Apr, Jul, Oct) on the 1st at 9:00 AM';
      default:
        return 'Custom schedule';
    }
  }

  getExecutionStatusColor(status: ScheduledReportExecution['status']): string {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'running':
        return '#2196f3';
      case 'completed':
        return '#4caf50';
      case 'failed':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  }

  // Initialize service
  async initialize(): Promise<void> {
    try {
      await this.loadSchedulesFromBackend();
      
      // Schedule all enabled schedules
      for (const schedule of this.schedules.values()) {
        if (schedule.enabled) {
          this.scheduleNextExecution(schedule);
        }
      }
      
      console.log(`Initialized report scheduling service with ${this.schedules.size} schedules`);
    } catch (error) {
      console.error('Failed to initialize report scheduling service:', error);
    }
  }

  // Cleanup
  destroy(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.schedules.clear();
    this.executions.clear();
  }
}

// Create singleton instance
export const reportSchedulingService = new ReportSchedulingService();

export default reportSchedulingService;