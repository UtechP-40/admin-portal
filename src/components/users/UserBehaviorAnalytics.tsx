import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Badge
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Flag as FlagIcon,
  AutoMode as AutoModeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementApi } from '../../services/userManagementApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface UserBehaviorAnalyticsProps {
  userId?: string;
}

const UserBehaviorAnalytics: React.FC<UserBehaviorAnalyticsProps> = ({ userId }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [metricType, setMetricType] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(userId);
  const [autoFlagThreshold, setAutoFlagThreshold] = useState(75);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [userToFlag, setUserToFlag] = useState<any>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagSeverity, setFlagSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  const queryClient = useQueryClient();

  // Flag user mutation
  const flagUserMutation = useMutation({
    mutationFn: ({ userId, reason, severity }: { userId: string; reason: string; severity: string }) =>
      userManagementApi.flagGameUser(userId, reason, severity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flaggedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['userBehaviorAnalytics'] });
      setFlagDialogOpen(false);
      setUserToFlag(null);
      setFlagReason('');
      setFlagSeverity('medium');
    }
  });

  // Auto-flag users based on threshold
  const autoFlagMutation = useMutation({
    mutationFn: (threshold: number) => 
      userManagementApi.executeModerationAction({
        userId: 'auto',
        actionType: 'flag',
        reason: `Automatically flagged for suspicious activity score above ${threshold}`,
        severity: 'medium'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flaggedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['userBehaviorAnalytics'] });
    }
  });

  // Fetch user behavior analytics
  const { data: behaviorData, isLoading, refetch } = useQuery({
    queryKey: ['userBehaviorAnalytics', userId, timeRange, metricType],
    queryFn: () => userManagementApi.getUserBehaviorAnalytics({
      userId,
      timeRange,
      metricType
    }),
    refetchInterval: 300000 // 5 minutes
  });

  // Fetch flagged users
  const { data: flaggedUsers } = useQuery({
    queryKey: ['flaggedUsers'],
    queryFn: () => userManagementApi.getFlaggedUsers()
  });

  // Fetch behavior patterns
  const { data: behaviorPatterns } = useQuery({
    queryKey: ['behaviorPatterns', timeRange],
    queryFn: () => userManagementApi.getBehaviorPatterns(timeRange)
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon />
          User Behavior Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Metric Type</InputLabel>
            <Select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value)}
            >
              <MenuItem value="all">All Metrics</MenuItem>
              <MenuItem value="gameplay">Gameplay</MenuItem>
              <MenuItem value="social">Social</MenuItem>
              <MenuItem value="security">Security</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Key Metrics */}
      {behaviorData?.metrics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Session Duration
                </Typography>
                <Typography variant="h4">
                  {Math.round(behaviorData.metrics.avgSessionDuration)}m
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {behaviorData.metrics.sessionDurationTrend > 0 ? (
                    <TrendingUpIcon color="success" fontSize="small" />
                  ) : (
                    <TrendingDownIcon color="error" fontSize="small" />
                  )}
                  <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                    {Math.abs(behaviorData.metrics.sessionDurationTrend)}% vs last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Games per Session
                </Typography>
                <Typography variant="h4">
                  {behaviorData.metrics.avgGamesPerSession.toFixed(1)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {behaviorData.metrics.gamesPerSessionTrend > 0 ? (
                    <TrendingUpIcon color="success" fontSize="small" />
                  ) : (
                    <TrendingDownIcon color="error" fontSize="small" />
                  )}
                  <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                    {Math.abs(behaviorData.metrics.gamesPerSessionTrend)}% vs last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Suspicious Activities
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {behaviorData.metrics.suspiciousActivities}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {behaviorData.metrics.suspiciousActivitiesRate}% of total activities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Cheat Detection Rate
                </Typography>
                <Typography variant="h4" color="error.main">
                  {behaviorData.metrics.cheatDetectionRate}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Of flagged activities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Activity Timeline */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Activity Timeline
            </Typography>
            {behaviorData?.timeline && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={behaviorData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" strokeWidth={2} name="Active Users" />
                  <Line type="monotone" dataKey="suspiciousActivities" stroke="#ff7300" strokeWidth={2} name="Suspicious Activities" />
                  <Line type="monotone" dataKey="flaggedUsers" stroke="#ff0000" strokeWidth={2} name="Flagged Users" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Behavior Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Behavior Risk Distribution
            </Typography>
            {behaviorData?.riskDistribution && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={behaviorData.riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {behaviorData.riskDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Flagged Users Table */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recently Flagged Users
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {flaggedUsers?.slice(0, 10).map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Tooltip title={user.flagReason}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {user.flagReason}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.severity}
                          color={getSeverityColor(user.severity) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.flaggedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!flaggedUsers?.length && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="textSecondary">
                          No flagged users found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Behavior Patterns */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Detected Behavior Patterns
            </Typography>
            {behaviorPatterns?.map((pattern: any, index: number) => (
              <Alert
                key={index}
                severity={getSeverityColor(pattern.severity) as any}
                sx={{ mb: 1 }}
                icon={<SecurityIcon />}
              >
                <Typography variant="subtitle2" gutterBottom>
                  {pattern.name}
                </Typography>
                <Typography variant="body2">
                  {pattern.description}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Detected in {pattern.userCount} users • Confidence: {pattern.confidence}%
                </Typography>
              </Alert>
            ))}
            {!behaviorPatterns?.length && (
              <Typography color="textSecondary" align="center">
                No suspicious patterns detected
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Game Performance Analytics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Game Performance Analytics
            </Typography>
            {behaviorData?.gamePerformance && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={behaviorData.gamePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gameType" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="avgWinRate" fill="#8884d8" name="Avg Win Rate %" />
                  <Bar dataKey="avgGameDuration" fill="#82ca9d" name="Avg Game Duration (min)" />
                  <Bar dataKey="suspiciousGames" fill="#ff7300" name="Suspicious Games" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Enhanced Flagging Controls */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlagIcon />
          Advanced Flagging System
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Auto-Flagging Configuration
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="body2">
                    Suspicious Activity Threshold:
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={autoFlagThreshold}
                    onChange={(e) => setAutoFlagThreshold(Number(e.target.value))}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{ width: 80 }}
                  />
                  <Typography variant="body2">%</Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AutoModeIcon />}
                  onClick={() => autoFlagMutation.mutate(autoFlagThreshold)}
                  disabled={autoFlagMutation.isPending}
                  color="warning"
                >
                  {autoFlagMutation.isPending ? 'Processing...' : 'Auto-Flag High Risk Users'}
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  This will automatically flag users with suspicious activity scores above the threshold.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Manual Flagging
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Flag users based on specific behavior patterns or manual review.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<FlagIcon />}
                  onClick={() => setFlagDialogOpen(true)}
                >
                  Flag User
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Insights and Recommendations */}
      {behaviorData?.insights && behaviorData.insights.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon />
            AI-Generated Insights
          </Typography>
          {behaviorData.insights.map((insight: any, index: number) => (
            <Alert key={index} severity="info" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {insight.title}
              </Typography>
              <Typography variant="body2">
                {insight.description}
              </Typography>
              {insight.recommendation && (
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                  Recommendation: {insight.recommendation}
                </Typography>
              )}
            </Alert>
          ))}
        </Paper>
      )}

      {/* Flag User Dialog */}
      <Dialog open={flagDialogOpen} onClose={() => setFlagDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Flag User for Suspicious Behavior</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="User ID or Username"
            value={userToFlag?.username || ''}
            onChange={(e) => setUserToFlag({ ...userToFlag, username: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Flag Reason"
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Severity</InputLabel>
            <Select
              value={flagSeverity}
              onChange={(e) => setFlagSeverity(e.target.value as 'low' | 'medium' | 'high')}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
          <Alert severity="warning">
            Flagging a user will mark them for review and may trigger automated moderation actions.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (userToFlag?.id && flagReason) {
                flagUserMutation.mutate({
                  userId: userToFlag.id,
                  reason: flagReason,
                  severity: flagSeverity
                });
              }
            }}
            color="warning"
            variant="contained"
            disabled={!userToFlag?.id || !flagReason || flagUserMutation.isPending}
          >
            {flagUserMutation.isPending ? 'Flagging...' : 'Flag User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserBehaviorAnalytics;