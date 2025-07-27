import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { People, Games, Speed, TrendingUp, Error, Timer, Memory, Wifi } from '@mui/icons-material';
import { MetricCard } from '../charts';
import { DashboardMetrics } from '../../services/analytics';

interface DashboardOverviewProps {
  metrics: DashboardMetrics;
  loading?: boolean;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ metrics, loading = false }) => {
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatResponseTime = (ms: number) => {
    return `${ms.toFixed(0)}ms`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dashboard Overview
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Events"
            value={metrics.overview.totalEvents.toLocaleString()}
            icon={<TrendingUp fontSize="large" />}
            color="#1976d2"
            loading={loading}
            subtitle="All tracked events"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Unique Users"
            value={metrics.overview.uniqueUsers.toLocaleString()}
            icon={<People fontSize="large" />}
            color="#2e7d32"
            loading={loading}
            subtitle="Active user accounts"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Users"
            value={metrics.overview.activeUsers.toLocaleString()}
            icon={<Wifi fontSize="large" />}
            color="#ed6c02"
            loading={loading}
            subtitle="Last 24 hours"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Error Rate"
            value={formatPercentage(metrics.overview.errorRate)}
            icon={<Error fontSize="large" />}
            color="#d32f2f"
            loading={loading}
            subtitle="Error percentage"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Response Time"
            value={formatResponseTime(metrics.overview.avgResponseTime)}
            icon={<Timer fontSize="large" />}
            color="#7b1fa2"
            loading={loading}
            subtitle="API response time"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="System Uptime"
            value={formatUptime(metrics.overview.systemUptime)}
            icon={<Speed fontSize="large" />}
            color="#1565c0"
            loading={loading}
            subtitle="Server uptime"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Memory Usage"
            value={`${((metrics.system?.memoryUsage?.heapUsed || 0) / 1024 / 1024).toFixed(0)}MB`}
            icon={<Memory fontSize="large" />}
            color="#5e35b1"
            loading={loading}
            subtitle="Heap memory used"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Games"
            value={(metrics.games?.GAME_START || 0) - (metrics.games?.GAME_END || 0)}
            icon={<Games fontSize="large" />}
            color="#00695c"
            loading={loading}
            subtitle="Currently running"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardOverview;