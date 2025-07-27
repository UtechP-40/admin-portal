import React, { useState } from 'react';
import { Grid, Paper, Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LineChart, BarChart, PieChart, AreaChart, HeatmapChart } from '../charts';
import { analyticsService } from '../../services/analytics';
import { useQuery } from '@tanstack/react-query';

interface GameAnalyticsProps {
  startDate: Date;
  endDate: Date;
}

const GameAnalytics: React.FC<GameAnalyticsProps> = ({ startDate, endDate }) => {
  const [granularity, setGranularity] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  const { data: gameAnalytics, isLoading } = useQuery({
    queryKey: ['gameAnalytics', startDate, endDate],
    queryFn: () => analyticsService.getGameAnalytics(startDate, endDate),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: gameSessionTrends } = useQuery({
    queryKey: ['gameSessionTrends', startDate, endDate, granularity],
    queryFn: () => analyticsService.getTimeBasedAggregation(
      'analytics_events',
      'count',
      startDate,
      endDate,
      granularity,
      true
    ),
  });

  const { data: gamePerformance } = useQuery({
    queryKey: ['gamePerformance', startDate, endDate],
    queryFn: () => analyticsService.executeCustomQuery({
      collection: 'performance_metrics',
      filters: {
        timestamp: { $gte: startDate, $lte: endDate },
        metricName: { $in: ['game_duration', 'player_count', 'room_capacity'] }
      },
      aggregation: [
        {
          $group: {
            _id: '$metricName',
            avg: { $avg: '$value' },
            min: { $min: '$value' },
            max: { $max: '$value' },
            count: { $sum: 1 }
          }
        }
      ]
    }),
  });

  const formatGameSessionData = () => {
    if (!gameSessionTrends?.current) return [];
    return gameSessionTrends.current.map((item: any) => ({
      date: item._id,
      sessions: item.count,
      previous: gameSessionTrends.previous?.find((p: any) => p._id === item._id)?.count || 0
    }));
  };

  const formatGameModeData = () => {
    if (!gameAnalytics?.gamesByMode) return [];
    return Object.entries(gameAnalytics.gamesByMode).map(([mode, count]) => ({
      mode: mode.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
      games: count as number
    }));
  };

  const formatPlayerCountData = () => {
    if (!gameAnalytics?.playerDistribution) return [];
    return Object.entries(gameAnalytics.playerDistribution).map(([count, games]) => ({
      players: `${count} players`,
      games: games as number
    }));
  };

  const formatGameDurationData = () => {
    if (!gameAnalytics?.durationDistribution) return [];
    return gameAnalytics.durationDistribution.map((item: any) => ({
      duration: `${item.min}-${item.max}min`,
      games: item.count
    }));
  };

  const formatWinRateData = () => {
    if (!gameAnalytics?.winRates) return [];
    return Object.entries(gameAnalytics.winRates).map(([role, rate]) => ({
      role: role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
      winRate: (rate as number) * 100
    }));
  };

  const formatHourlyActivityData = () => {
    if (!gameAnalytics?.hourlyActivity) return [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const data = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const activity = gameAnalytics.hourlyActivity[day]?.[hour] || 0;
        data.push({
          x: hour,
          y: days[day],
          value: activity,
          label: `${days[day]} ${hour}:00 - ${activity} games`
        });
      }
    }
    return data;
  };

  const formatPerformanceMetrics = () => {
    if (!gamePerformance) return [];
    return gamePerformance.map((metric: any) => ({
      metric: metric._id.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
      average: metric.avg,
      minimum: metric.min,
      maximum: metric.max
    }));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Game Analytics
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
        {/* Game Session Trends */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <LineChart
              data={formatGameSessionData()}
              title="Game Session Trends"
              xKey="date"
              yKey="sessions"
              height={350}
              formatTooltip={(value, name) => [
                `${value} sessions`,
                name === 'sessions' ? 'Current Period' : 'Previous Period'
              ]}
            />
            {gameSessionTrends?.comparison && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  {gameSessionTrends.comparison.trend === 'up' ? '↗️' : 
                   gameSessionTrends.comparison.trend === 'down' ? '↘️' : '➡️'} 
                  {' '}
                  {gameSessionTrends.comparison.percentChange > 0 ? '+' : ''}
                  {gameSessionTrends.comparison.percentChange.toFixed(1)}% vs previous period
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Game Modes */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <PieChart
              data={formatGameModeData()}
              title="Games by Mode"
              dataKey="games"
              nameKey="mode"
              height={350}
              formatTooltip={(value, name) => [`${value} games`, name]}
            />
          </Paper>
        </Grid>

        {/* Player Count Distribution */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <BarChart
              data={formatPlayerCountData()}
              title="Player Count Distribution"
              xKey="players"
              yKey="games"
              height={300}
              formatTooltip={(value, name) => [`${value} games`, 'Games']}
            />
          </Paper>
        </Grid>

        {/* Game Duration Distribution */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <BarChart
              data={formatGameDurationData()}
              title="Game Duration Distribution"
              xKey="duration"
              yKey="games"
              height={300}
              formatTooltip={(value, name) => [`${value} games`, 'Games']}
            />
          </Paper>
        </Grid>

        {/* Win Rates by Role */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <BarChart
              data={formatWinRateData()}
              title="Win Rates by Role"
              xKey="role"
              yKey="winRate"
              height={300}
              horizontal
              formatTooltip={(value, name) => [`${value.toFixed(1)}%`, 'Win Rate']}
            />
          </Paper>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <AreaChart
              data={formatPerformanceMetrics()}
              title="Game Performance Metrics"
              xKey="metric"
              yKey="average"
              height={300}
              formatTooltip={(value, name) => [`${value.toFixed(2)}`, 'Average']}
            />
          </Paper>
        </Grid>

        {/* Hourly Activity Heatmap */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <HeatmapChart
              data={formatHourlyActivityData()}
              title="Game Activity Heatmap (Day vs Hour)"
              width={800}
              height={200}
              cellSize={30}
              showLabels={false}
              formatTooltip={(data) => data.label || `${data.x}, ${data.y}: ${data.value}`}
            />
          </Paper>
        </Grid>

        {/* Recent Game Statistics */}
        {gameAnalytics?.recentStats && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Game Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {gameAnalytics.recentStats.totalGames}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Games
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="secondary">
                      {gameAnalytics.recentStats.avgDuration.toFixed(1)}min
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Duration
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {gameAnalytics.recentStats.avgPlayers.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Players
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {(gameAnalytics.recentStats.completionRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completion Rate
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

export default GameAnalytics;