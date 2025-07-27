import React, { useState, useEffect } from 'react';
import { Grid, Paper, Box, Typography, FormControl, InputLabel, Select, MenuItem, DatePicker } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LineChart, BarChart, PieChart, AreaChart } from '../charts';
import { analyticsService } from '../../services/analytics';
import { useQuery } from '@tanstack/react-query';

interface UserAnalyticsProps {
  startDate: Date;
  endDate: Date;
}

const UserAnalytics: React.FC<UserAnalyticsProps> = ({ startDate, endDate }) => {
  const [granularity, setGranularity] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  const { data: userAnalytics, isLoading } = useQuery({
    queryKey: ['userAnalytics', startDate, endDate],
    queryFn: () => analyticsService.getUserAnalytics(startDate, endDate),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { data: registrationTrends } = useQuery({
    queryKey: ['registrationTrends', startDate, endDate, granularity],
    queryFn: () => analyticsService.getTimeBasedAggregation(
      'analytics_events',
      'count',
      startDate,
      endDate,
      granularity,
      true
    ),
  });

  const { data: engagementMetrics } = useQuery({
    queryKey: ['engagementMetrics', startDate, endDate],
    queryFn: () => analyticsService.executeCustomQuery({
      collection: 'analytics_events',
      filters: {
        timestamp: { $gte: startDate, $lte: endDate },
        eventType: { $in: ['USER_LOGIN', 'GAME_START', 'GAME_END', 'PLAYER_JOIN'] }
      },
      aggregation: [
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 }
          }
        }
      ]
    }),
  });

  const formatRegistrationData = () => {
    if (!registrationTrends?.current) return [];
    return registrationTrends.current.map((item: any) => ({
      date: item._id,
      registrations: item.count,
      previous: registrationTrends.previous?.find((p: any) => p._id === item._id)?.count || 0
    }));
  };

  const formatEngagementData = () => {
    if (!engagementMetrics) return [];
    return engagementMetrics.map((item: any) => ({
      name: item._id.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
      value: item.count
    }));
  };

  const formatUserActivityData = () => {
    if (!userAnalytics?.activityByHour) return [];
    return userAnalytics.activityByHour.map((item: any, index: number) => ({
      hour: `${index}:00`,
      activity: item.count || 0
    }));
  };

  const formatRetentionData = () => {
    if (!userAnalytics?.retention) return [];
    return Object.entries(userAnalytics.retention).map(([period, rate]) => ({
      period,
      retention: (rate as number) * 100
    }));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          User Analytics
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Granularity</InputLabel>
          <Select
            value={granularity}
            label="Granularity"
            onChange={(e) => setGranularity(e.target.value as any)}
          >
            <MenuItem value="hour">Hour</MenuItem>
            <MenuItem value="day">Day</MenuItem>
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Registration Trends */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <LineChart
              data={formatRegistrationData()}
              title="User Registration Trends"
              xKey="date"
              yKey="registrations"
              height={350}
              formatTooltip={(value, name) => [
                `${value} registrations`,
                name === 'registrations' ? 'Current Period' : 'Previous Period'
              ]}
            />
            {registrationTrends?.comparison && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  {registrationTrends.comparison.trend === 'up' ? '↗️' : 
                   registrationTrends.comparison.trend === 'down' ? '↘️' : '➡️'} 
                  {' '}
                  {registrationTrends.comparison.percentChange > 0 ? '+' : ''}
                  {registrationTrends.comparison.percentChange.toFixed(1)}% vs previous period
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* User Engagement */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <PieChart
              data={formatEngagementData()}
              title="User Engagement"
              dataKey="value"
              nameKey="name"
              height={350}
              formatTooltip={(value, name) => [`${value} events`, name]}
            />
          </Paper>
        </Grid>

        {/* Activity by Hour */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <AreaChart
              data={formatUserActivityData()}
              title="User Activity by Hour"
              xKey="hour"
              yKey="activity"
              height={300}
              formatTooltip={(value, name) => [`${value} active users`, 'Activity']}
            />
          </Paper>
        </Grid>

        {/* User Retention */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <BarChart
              data={formatRetentionData()}
              title="User Retention Rates"
              xKey="period"
              yKey="retention"
              height={300}
              formatTooltip={(value, name) => [`${value.toFixed(1)}%`, 'Retention Rate']}
            />
          </Paper>
        </Grid>

        {/* User Demographics */}
        {userAnalytics?.demographics && (
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <PieChart
                data={userAnalytics.demographics.byCountry || []}
                title="Users by Country"
                dataKey="count"
                nameKey="country"
                height={300}
              />
            </Paper>
          </Grid>
        )}

        {/* Device Analytics */}
        {userAnalytics?.devices && (
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <BarChart
                data={userAnalytics.devices.byPlatform || []}
                title="Users by Platform"
                xKey="platform"
                yKey="count"
                height={300}
                horizontal
              />
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default UserAnalytics;