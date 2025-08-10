import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketService, RealtimeMetrics, MetricAlert } from '../services/websocketService';
import { analyticsService, DashboardMetrics } from '../services/analytics';

export interface RealtimeMetricsState {
  metrics: DashboardMetrics | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  alerts: MetricAlert[];
}

export interface UseRealtimeMetricsOptions {
  enabled?: boolean;
  fallbackInterval?: number; // Fallback polling interval in ms
  maxAlerts?: number; // Maximum number of alerts to keep
}

export const useRealtimeMetrics = (options: UseRealtimeMetricsOptions = {}) => {
  const {
    enabled = true,
    fallbackInterval = 30000, // 30 seconds
    maxAlerts = 50,
  } = options;

  const [state, setState] = useState<RealtimeMetricsState>({
    metrics: null,
    isConnected: false,
    isLoading: true,
    error: null,
    lastUpdate: null,
    alerts: [],
  });

  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeMetricsRef = useRef<(() => void) | null>(null);
  const unsubscribeAlertsRef = useRef<(() => void) | null>(null);

  // Convert realtime metrics to dashboard metrics format
  const convertRealtimeMetrics = useCallback((realtimeMetrics: RealtimeMetrics): DashboardMetrics => {
    return {
      overview: {
        totalEvents: realtimeMetrics.totalEvents,
        uniqueUsers: realtimeMetrics.uniqueUsers,
        activeUsers: realtimeMetrics.activeUsers,
        errorRate: realtimeMetrics.errorRate,
        avgResponseTime: realtimeMetrics.avgResponseTime,
        systemUptime: realtimeMetrics.systemUptime,
      },
      games: {
        GAME_START: realtimeMetrics.activeGames,
        GAME_END: 0, // This would need to be tracked separately
      },
      errors: {},
      performance: {},
      engagement: {},
      system: {
        memoryUsage: realtimeMetrics.memoryUsage,
      },
      timeRange: {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        endDate: new Date(),
        granularity: 'hour',
      },
      generatedAt: realtimeMetrics.timestamp,
    };
  }, []);

  // Fallback polling function
  const fetchMetricsFallback = useCallback(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      
      const metrics = await analyticsService.getDashboardMetrics({
        startDate,
        endDate,
        granularity: 'hour',
      });

      setState(prev => ({
        ...prev,
        metrics,
        lastUpdate: new Date(),
        error: null,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch metrics fallback:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
        isLoading: false,
      }));
    }
  }, []);

  // Setup WebSocket connection and subscriptions
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const setupConnection = async () => {
      try {
        // Connect to WebSocket
        await websocketService.connect();

        if (!mounted) return;

        // Subscribe to metrics updates
        unsubscribeMetricsRef.current = websocketService.subscribeToMetrics((realtimeMetrics: RealtimeMetrics) => {
          if (!mounted) return;

          const dashboardMetrics = convertRealtimeMetrics(realtimeMetrics);
          setState(prev => ({
            ...prev,
            metrics: dashboardMetrics,
            lastUpdate: new Date(),
            error: null,
            isLoading: false,
          }));
        });

        // Subscribe to alerts
        unsubscribeAlertsRef.current = websocketService.subscribeToAlerts((alert: MetricAlert) => {
          if (!mounted) return;

          setState(prev => ({
            ...prev,
            alerts: [alert, ...prev.alerts.slice(0, maxAlerts - 1)],
          }));
        });

        // Listen for connection status changes
        websocketService.on('connected', () => {
          if (!mounted) return;
          setState(prev => ({ ...prev, isConnected: true, error: null }));
        });

        websocketService.on('disconnected', () => {
          if (!mounted) return;
          setState(prev => ({ ...prev, isConnected: false }));
        });

        websocketService.on('error', (error: Error) => {
          if (!mounted) return;
          setState(prev => ({ 
            ...prev, 
            error: error.message,
            isConnected: false,
          }));
        });

        setState(prev => ({ ...prev, isConnected: websocketService.connected }));

      } catch (error) {
        console.error('Failed to setup WebSocket connection:', error);
        
        if (!mounted) return;

        setState(prev => ({
          ...prev,
          isConnected: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        }));

        // Start fallback polling
        fetchMetricsFallback();
        fallbackIntervalRef.current = setInterval(fetchMetricsFallback, fallbackInterval);
      }
    };

    setupConnection();

    return () => {
      mounted = false;
      
      // Cleanup subscriptions
      if (unsubscribeMetricsRef.current) {
        unsubscribeMetricsRef.current();
        unsubscribeMetricsRef.current = null;
      }
      
      if (unsubscribeAlertsRef.current) {
        unsubscribeAlertsRef.current();
        unsubscribeAlertsRef.current = null;
      }

      // Clear fallback interval
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [enabled, convertRealtimeMetrics, fetchMetricsFallback, fallbackInterval, maxAlerts]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    if (websocketService.connected) {
      // Request fresh metrics from WebSocket
      websocketService.send('metrics:refresh');
    } else {
      // Use fallback
      await fetchMetricsFallback();
    }
  }, [fetchMetricsFallback]);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setState(prev => ({ ...prev, alerts: [] }));
  }, []);

  // Dismiss specific alert
  const dismissAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId),
    }));
  }, []);

  return {
    ...state,
    refresh,
    clearAlerts,
    dismissAlert,
    connectionInfo: websocketService.getConnectionInfo(),
  };
};