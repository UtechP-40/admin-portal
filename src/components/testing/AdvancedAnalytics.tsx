import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Badge,
  Tooltip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  Insights as InsightsIcon,
  Report as ReportIcon,
  AutoGraph as AutoGraphIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';

interface GameBalanceMetrics {
  roleWinRates: {
    [role: string]: {
      winRate: number;
      gamesPlayed: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  averageGameDuration: number;
  playerEliminationRates: {
    day: number;
    night: number;
  };
  votingPatterns: {
    averageVotesPerPlayer: number;
    unanimousVotes: number;
    splitVotes: number;
  };
  balanceScore: number;
  recommendations: string[];
}

interface PlayerEngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  retentionRates: {
    day1: number;
    day7: number;
    day30: number;
  };
  churnRate: number;
  engagementScore: number;
  topEngagementFactors: string[];
}

interface GameHealthReport {
  id: string;
  generatedAt: string;
  period: string;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  healthScore: number;
  metrics: {
    playerSatisfaction: number;
    gameBalance: number;
    technicalPerformance: number;
    communityHealth: number;
  };
  alerts: HealthAlert[];
  recommendations: string[];
  trends: {
    playerGrowth: number;
    engagementTrend: number;
    retentionTrend: number;
  };
}

interface HealthAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'balance' | 'engagement' | 'performance' | 'community';
  message: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
  resolved: boolean;
}

interface AnalyticsReport {
  id: string;
  name: string;
  type: 'balance' | 'engagement' | 'retention' | 'performance' | 'custom';
  schedule: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  lastGenerated: string;
  nextScheduled?: string;
  status: 'active' | 'paused' | 'error';
  recipients: string[];
}

export function AdvancedAnalytics() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showHealthDetails, setShowHealthDetails] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GameHealthReport | null>(null);
  const [autoReportsEnabled, setAutoReportsEnabled] = useState(true);

  const queryClient = useQueryClient();

  // Fetch game balance metrics
  const { data: balanceMetrics, isLoading: balanceLoading } = useQuery({
    queryKey: ['game-balance', selectedTimeRange],
    queryFn: () => apiService.get(`/admin/analytics/game-balance?period=${selectedTimeRange}`),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch player engagement metrics
  const { data: engagementMetrics, isLoading: engagementLoading } = useQuery({
    queryKey: ['player-engagement', selectedTimeRange],
    queryFn: () => apiService.get(`/admin/analytics/player-engagement?period=${selectedTimeRange}`),
    refetchInterval: 300000,
  });

  // Fetch game health reports
  const { data: healthReports } = useQuery({
    queryKey: ['health-reports'],
    queryFn: () => apiService.get('/admin/analytics/health-reports'),
    refetchInterval: 600000, // Refresh every 10 minutes
  });

  // Fetch scheduled reports
  const { data: scheduledReports } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: () => apiService.get('/admin/analytics/scheduled-reports'),
  });

  // Mutations
  const generateReportMutation = useMutation({
    mutationFn: (reportType: string) =>
      apiService.post('/admin/analytics/generate-report', { type: reportType, period: selectedTimeRange }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-reports'] });
    },
  });

  const createScheduledReportMutation = useMutation({
    mutationFn: (reportData: Partial<AnalyticsReport>) =>
      apiService.post('/admin/analytics/scheduled-reports', reportData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      setShowReportDialog(false);
    },
  });

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUpIcon color="success" />;
      case 'down': return <TrendingDownIcon color="error" />;
      default: return <ShowChartIcon color="disabled" />;
    }
  };

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Game Balance" icon={<BarChartIcon />} />
            <Tab label="Player Engagement" icon={<TrendingUpIcon />} />
            <Tab label="Health Reports" icon={<AssessmentIcon />} />
            <Tab label="Scheduled Reports" icon={<ScheduleIcon />} />
          </Tabs>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="1d">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              startIcon={<ReportIcon />}
              onClick={() => generateReportMutation.mutate('comprehensive')}
              disabled={generateReportMutation.isPending}
            >
              Generate Report
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Game Balance Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Game Balance Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Comprehensive analysis of game balance metrics and role performance
              </Typography>

              {balanceLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography color="textSecondary" gutterBottom>
                              Balance Score
                            </Typography>
                            <Typography variant="h4">
                              {balanceMetrics?.data?.balanceScore || 0}/100
                            </Typography>
                          </Box>
                          <CircularProgress
                            variant="determinate"
                            value={balanceMetrics?.data?.balanceScore || 0}
                            size={60}
                            color={
                              (balanceMetrics?.data?.balanceScore || 0) > 80 ? 'success' :
                              (balanceMetrics?.data?.balanceScore || 0) > 60 ? 'warning' : 'error'
                            }
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Average Game Duration
                        </Typography>
                        <Typography variant="h4">
                          {Math.round((balanceMetrics?.data?.averageGameDuration || 0) / 60)}m
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(balanceMetrics?.data?.averageGameDuration || 0) > 1800 ? 'Above target' : 'Within target'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Voting Engagement
                        </Typography>
                        <Typography variant="h4">
                          {(balanceMetrics?.data?.votingPatterns?.averageVotesPerPlayer || 0).toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Votes per player
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Role Win Rates
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Role</TableCell>
                            <TableCell>Win Rate</TableCell>
                            <TableCell>Games Played</TableCell>
                            <TableCell>Trend</TableCell>
                            <TableCell>Balance Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(balanceMetrics?.data?.roleWinRates || {}).map(([role, data]: [string, any]) => (
                            <TableRow key={role}>
                              <TableCell>
                                <Chip label={role} variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={data.winRate * 100}
                                    sx={{ width: 100, height: 8 }}
                                    color={
                                      data.winRate > 0.6 || data.winRate < 0.4 ? 'error' :
                                      data.winRate > 0.55 || data.winRate < 0.45 ? 'warning' : 'success'
                                    }
                                  />
                                  <Typography variant="body2">
                                    {(data.winRate * 100).toFixed(1)}%
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{data.gamesPlayed}</TableCell>
                              <TableCell>{getTrendIcon(data.trend)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={
                                    data.winRate > 0.6 || data.winRate < 0.4 ? 'Unbalanced' :
                                    data.winRate > 0.55 || data.winRate < 0.45 ? 'Needs Attention' : 'Balanced'
                                  }
                                  color={
                                    data.winRate > 0.6 || data.winRate < 0.4 ? 'error' :
                                    data.winRate > 0.55 || data.winRate < 0.45 ? 'warning' : 'success'
                                  }
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Balance Recommendations
                    </Typography>
                    <List>
                      {balanceMetrics?.data?.recommendations?.map((recommendation: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={recommendation}
                            secondary={`Priority: ${index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low'}`}
                          />
                        </ListItem>
                      )) || (
                        <ListItem>
                          <ListItemText
                            primary="Game balance is within acceptable parameters"
                            secondary="No immediate adjustments needed"
                          />
                        </ListItem>
                      )}
                    </List>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Player Engagement Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Player Engagement & Retention Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Detailed insights into player behavior, engagement patterns, and retention metrics
              </Typography>

              {engagementLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Daily Active Users
                        </Typography>
                        <Typography variant="h4">
                          {engagementMetrics?.data?.dailyActiveUsers || 0}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          +12% from yesterday
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Weekly Active Users
                        </Typography>
                        <Typography variant="h4">
                          {engagementMetrics?.data?.weeklyActiveUsers || 0}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          +8% from last week
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Avg Session Duration
                        </Typography>
                        <Typography variant="h4">
                          {Math.round((engagementMetrics?.data?.averageSessionDuration || 0) / 60)}m
                        </Typography>
                        <Typography variant="body2" color="warning.main">
                          -3% from last week
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Engagement Score
                        </Typography>
                        <Typography variant="h4">
                          {engagementMetrics?.data?.engagementScore || 0}/100
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          Excellent
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Retention Rates
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary="Day 1 Retention"
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={(engagementMetrics?.data?.retentionRates?.day1 || 0) * 100}
                                  sx={{ width: 100, height: 8 }}
                                  color="success"
                                />
                                <Typography variant="body2">
                                  {((engagementMetrics?.data?.retentionRates?.day1 || 0) * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Day 7 Retention"
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={(engagementMetrics?.data?.retentionRates?.day7 || 0) * 100}
                                  sx={{ width: 100, height: 8 }}
                                  color="warning"
                                />
                                <Typography variant="body2">
                                  {((engagementMetrics?.data?.retentionRates?.day7 || 0) * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Day 30 Retention"
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={(engagementMetrics?.data?.retentionRates?.day30 || 0) * 100}
                                  sx={{ width: 100, height: 8 }}
                                  color="error"
                                />
                                <Typography variant="body2">
                                  {((engagementMetrics?.data?.retentionRates?.day30 || 0) * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Top Engagement Factors
                      </Typography>
                      <List>
                        {engagementMetrics?.data?.topEngagementFactors?.map((factor: string, index: number) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={factor}
                              secondary={`Impact: ${index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low'}`}
                            />
                          </ListItem>
                        )) || (
                          <ListItem>
                            <ListItemText primary="No engagement factors data available" />
                          </ListItem>
                        )}
                      </List>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Health Reports Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Game Health Reports
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoReportsEnabled}
                      onChange={(e) => setAutoReportsEnabled(e.target.checked)}
                    />
                  }
                  label="Auto Reports"
                />
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                {healthReports?.data?.slice(0, 4).map((report: GameHealthReport) => (
                  <Grid item xs={12} sm={6} md={3} key={report.id}>
                    <Card sx={{ cursor: 'pointer' }} onClick={() => {
                      setSelectedReport(report);
                      setShowHealthDetails(true);
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Chip
                            label={report.overallHealth}
                            color={getHealthColor(report.overallHealth) as any}
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(report.generatedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography variant="h4" gutterBottom>
                          {report.healthScore}/100
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.period} Report
                        </Typography>
                        {report.alerts.length > 0 && (
                          <Badge badgeContent={report.alerts.length} color="error" sx={{ mt: 1 }}>
                            <WarningIcon />
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" gutterBottom>
                Recent Health Alerts
              </Typography>
              <List>
                {healthReports?.data?.[0]?.alerts?.slice(0, 5).map((alert: HealthAlert) => (
                  <ListItem key={alert.id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={alert.type}
                            color={getAlertColor(alert.type) as any}
                            size="small"
                          />
                          <Chip
                            label={alert.category}
                            variant="outlined"
                            size="small"
                          />
                          <Typography variant="body2">
                            {alert.message}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Typography variant="caption">
                            Impact: {alert.impact}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(alert.timestamp).toLocaleString()}
                          </Typography>
                          {alert.resolved && (
                            <Chip label="Resolved" color="success" size="small" />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                )) || (
                  <ListItem>
                    <ListItemText primary="No recent health alerts" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Scheduled Reports Tab */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Scheduled Reports
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<ScheduleIcon />}
                  onClick={() => setShowReportDialog(true)}
                >
                  Schedule Report
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Report Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Schedule</TableCell>
                      <TableCell>Last Generated</TableCell>
                      <TableCell>Next Scheduled</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scheduledReports?.data?.map((report: AnalyticsReport) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.name}</TableCell>
                        <TableCell>
                          <Chip label={report.type} variant="outlined" size="small" />
                        </TableCell>
                        <TableCell>{report.schedule}</TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(report.lastGenerated).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {report.nextScheduled ? new Date(report.nextScheduled).toLocaleString() : 'On-demand'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.status}
                            color={report.status === 'active' ? 'success' : report.status === 'error' ? 'error' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Download Latest">
                              <IconButton size="small">
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Details">
                              <IconButton size="small">
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Health Report Details Dialog */}
      <Dialog open={showHealthDetails} onClose={() => setShowHealthDetails(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Game Health Report Details
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Overall Health: {selectedReport.overallHealth}
                  </Typography>
                  <Typography variant="h4" gutterBottom>
                    {selectedReport.healthScore}/100
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Generated: {new Date(selectedReport.generatedAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Period: {selectedReport.period}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Health Metrics
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Player Satisfaction"
                        secondary={`${selectedReport.metrics.playerSatisfaction}/100`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Game Balance"
                        secondary={`${selectedReport.metrics.gameBalance}/100`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Technical Performance"
                        secondary={`${selectedReport.metrics.technicalPerformance}/100`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Community Health"
                        secondary={`${selectedReport.metrics.communityHealth}/100`}
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Recommendations
                  </Typography>
                  <List>
                    {selectedReport.recommendations.map((recommendation, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={recommendation} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHealthDetails(false)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Download Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Report Dialog */}
      <Dialog open={showReportDialog} onClose={() => setShowReportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Schedule New Report
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Report Name"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Report Type</InputLabel>
              <Select label="Report Type">
                <MenuItem value="balance">Game Balance</MenuItem>
                <MenuItem value="engagement">Player Engagement</MenuItem>
                <MenuItem value="retention">Retention Analysis</MenuItem>
                <MenuItem value="performance">Performance Metrics</MenuItem>
                <MenuItem value="custom">Custom Report</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Schedule</InputLabel>
              <Select label="Schedule">
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="on-demand">On-demand</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Recipients (comma-separated emails)"
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>Cancel</Button>
          <Button variant="contained">Schedule Report</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}