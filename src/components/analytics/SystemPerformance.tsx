import React, { useState, useEffect } from 'react';
import { Grid, Paper, Box, Typography, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import { LineChart, AreaChart, MetricCard } from '../charts';
import { analyticsService } from '../../services/analytics';
import { useQuery } from '@tanstack/react-query';
import { Memory, Speed, Storage, NetworkCheck, Error, Timer } from '@mui/icons-material';

interface SystemPerformanceProps {
  startDate: Date;
  endDate: Date;
}

const SystemPerformance: React.FC<SystemPerformanceProps> = ({ startDate, endDate }) => {
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds

  const { data: systemPerformance, isLoading } = useQuery({
    queryKey: ['systemPerformance', startDate, endDate],
    queryFn: () => analyticsService.getSystemPerformance(startDate, endDate),
    refetchInterval: refreshInterval,
  });

  const { data: performanceMetrics } = useQuery({
    queryKey: ['performanceMetrics', startDate, endDate],
    queryFn: () => analyticsService.getTimeBasedAggregation(
      'performance_metrics',
      'value',
      startDate,
      endDate,
      'hour',
      false
    ),
    refetchInterval: refreshInterval,
  });

  const { data: errorMetrics } = useQuery({
    queryKey: ['errorMetrics', startDate, endDate],
    queryFn: () => analyticsService.executeCustomQuery({
      collection: 'error_logs',
      filters: {
        timestamp: { $gte: startDate, $lte: endDate }
      },
      aggregation: [
        {
          $group: {
            _id: {
              hour: { $hour: '$timestamp' },
              severity: '$severity'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.hour',
            errors: {
              $push: {
                severity: '$_id.severity',
                count: '$count'
              }
            },
            total: { $sum: '$count' }
          }
        },
        { $sort: { '_id': 1 } }
      ]
    }),
    refetchInterval: refreshInterval,
  });

  const formatCpuUsageData = () => {
    if (!systemPerformance?.cpuUsage) return [];
    return systemPerformance.cpuUsage.map((item: any, index: number) => ({
      time: new Date(Date.now() - (systemPerformance.cpuUsage.length - index) * 60000).toLocaleTimeString(),
      cpu: item.percentage,
      user: item.user,
      system: item.system
    }));
  };

  const formatMemoryUsageData = () => {
    if (!systemPerformance?.memoryUsage) return [];
    return systemPerformance.memoryUsage.map((item: any, index: number) => ({
      time: new Date(Date.now() - (systemPerformance.memoryUsage.length - index) * 60000).toLocaleTimeString(),
      heap: item.heapUsed / 1024 / 1024, // Convert to MB
      external: item.external / 1024 / 1024,
      rss: item.rss / 1024 / 1024
    }));
  };

  const formatResponseTimeData = () => {
    if (!performanceMetrics?.current) return [];
    return performanceMetrics.current
      .filter((item: any) => item.metricName === 'response_time')
      .map((item: any) => ({
        time: item._id,
        responseTime: item.avgValue || item.avg,
        min: item.minValue || item.min,
        max: item.maxValue || item.max
      }));
  };

  const formatErrorData = () => {
    if (!errorMetrics) return [];
    return errorMetrics.map((item: any) => ({
      hour: `${item._id}:00`,
      total: item.total,
      critical: item.errors.find((e: any) => e.severity === 'critical')?.count || 0,
      error: item.errors.find((e: any) => e.severity === 'error')?.count || 0,
      warning: item.errors.find((e: any) => e.severity === 'warning')?.count || 0
    }));
  };

  const formatNetworkData = () => {
    if (!systemPerformance?.networkStats) return [];
    return systemPerformance.networkStats.map((item: any, index: number) => ({
      time: new Date(Date.now() - (systemPerformance.networkStats.length - index) * 60000).toLocaleTimeString(),
      bytesIn: item.bytesReceived / 1024, // Convert to KB
      bytesOut: item.bytesSent / 1024,
      connections: item.activeConnections
    }));
  };

  const getCurrentMetrics = () => {
    if (!systemPerformance?.current) return null;
    return systemPerformance.current;
  };

  const currentMetrics = getCurrentMetrics();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          System Performance
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Refresh Rate</InputLabel>
          <Select
            value={refreshInterval}
            label="Refresh Rate"
            onChange={(e) => setRefreshInterval(e.target.value as number)}
          >
            <MenuItem value={5000}>5 seconds</MenuItem>
            <MenuItem value={15000}>15 seconds</MenuItem>
            <MenuItem value={30000}>30 seconds</MenuItem>
            <MenuItem value={60000}>1 minute</MenuItem>
            <MenuItem value={300000}>5 minutes</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Current System Status */}
      {currentMetrics && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={2}>
            <MetricCard
              title="CPU Usage"
              value={`${currentMetrics.cpu?.percentage?.toFixed(1) || 0}%`}
              icon={<Speed fontSize="large" />}
              color="#1976d2"
              loading={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <MetricCard
              title="Memory Usage"
              value={`${((currentMetrics.memory?.heapUsed || 0) / 1024 / 1024).toFixed(0)}MB`}
              icon={<Memory fontSize="large" />}
              color="#2e7d32"
              loading={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <MetricCard
              title="Disk Usage"
              value={`${currentMetrics.disk?.usedPercentage?.toFixed(1) || 0}%`}
              icon={<Storage fontSize="large" />}
              color="#ed6c02"
              loading={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <MetricCard
              title="Active Connections"
              value={currentMetrics.network?.activeConnections || 0}
              icon={<NetworkCheck fontSize="large" />}
              color="#7b1fa2"
              loading={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <MetricCard
              title="Error Rate"
              value={`${currentMetrics.errors?.rate?.toFixed(2) || 0}%`}
              icon={<Error fontSize="large" />}
              color="#d32f2f"
              loading={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <MetricCard
              title="Avg Response"
              value={`${currentMetrics.responseTime?.avg?.toFixed(0) || 0}ms`}
              icon={<Timer fontSize="large" />}
              color="#1565c0"
              loading={isLoading}
            />
          </Grid>
        </Grid>
      )}

      {/* System Health Alert */}
      {currentMetrics && (
        <>
          {(currentMetrics.cpu?.percentage > 80 || 
            currentMetrics.memory?.heapUsed / currentMetrics.memory?.heapTotal > 0.9 ||
            currentMetrics.errors?.rate > 5) && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              System performance issues detected. High resource usage or error rates may impact user experience.
            </Alert>
          )}
        </>
      )}

      <Grid container spacing={3}>
        {/* CPU Usage Chart */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <AreaChart
              data={formatCpuUsageData()}
              title="CPU Usage Over Time"
              xKey="time"
              yKey="cpu"
              height={300}
              formatTooltip={(value, name) => [`${value.toFixed(1)}%`, 'CPU Usage']}
            />
          </Paper>
        </Grid>

        {/* Memory Usage Chart */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <AreaChart
              data={formatMemoryUsageData()}
              title="Memory Usage Over Time"
              xKey="time"
              yKey="heap"
              height={300}
              formatTooltip={(value, name) => [`${value.toFixed(1)}MB`, 'Heap Memory']}
            />
          </Paper>
        </Grid>

        {/* Response Time Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <LineChart
              data={formatResponseTimeData()}
              title="API Response Time"
              xKey="time"
              yKey="responseTime"
              height={350}
              formatTooltip={(value, name) => [`${value.toFixed(0)}ms`, 'Response Time']}
            />
          </Paper>
        </Grid>

        {/* Error Metrics */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <AreaChart
              data={formatErrorData()}
              title="Error Count by Hour"
              xKey="hour"
              yKey="total"
              height={350}
              stacked
              formatTooltip={(value, name) => [`${value} errors`, 'Total Errors']}
            />
          </Paper>
        </Grid>

        {/* Network Statistics */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <LineChart
              data={formatNetworkData()}
              title="Network Traffic"
              xKey="time"
              yKey="bytesIn"
              height={300}
              formatTooltip={(value, name) => [`${value.toFixed(1)}KB`, 'Bytes In']}
            />
          </Paper>
        </Grid>

        {/* Database Performance */}
        {systemPerformance?.database && (
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Database Performance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {systemPerformance.database.connections?.active || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Connections
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="secondary">
                      {systemPerformance.database.queries?.avgTime?.toFixed(0) || 0}ms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Query Time
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {systemPerformance.database.operations?.total || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Operations
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {((systemPerformance.database.cache?.hitRate || 0) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cache Hit Rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default SystemPerformance;