import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemConfigurationApi, FeatureFlagImpact } from '../../services/systemConfigurationApi';

interface FeatureFlagImpactTrackerProps {
  featureFlagKey: string;
  environment: string;
  onClose?: () => void;
}

const FeatureFlagImpactTracker: React.FC<FeatureFlagImpactTrackerProps> = ({
  featureFlagKey,
  environment,
  onClose
}) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date()
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Fetch feature flag impact data
  const { data: impactData, isLoading: impactLoading } = useQuery({
    queryKey: ['featureFlagImpact', featureFlagKey, environment, dateRange],
    queryFn: () => systemConfigurationApi.getFeatureFlagImpact(featureFlagKey, environment, dateRange)
  });

  // Fetch feature flag metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['featureFlagMetrics', featureFlagKey, environment, dateRange],
    queryFn: () => systemConfigurationApi.getFeatureFlagMetrics(featureFlagKey, environment, dateRange)
  });

  // Fetch feature flag history
  const { data: historyData } = useQuery({
    queryKey: ['featureFlagHistory', featureFlagKey, environment],
    queryFn: () => systemConfigurationApi.getFeatureFlagHistory(featureFlagKey, environment, 50),
    enabled: historyOpen
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: (version: number) =>
      systemConfigurationApi.rollbackFeatureFlag(featureFlagKey, environment, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
      queryClient.invalidateQueries({ queryKey: ['featureFlagHistory'] });
      setRollbackOpen(false);
      setSelectedVersion(null);
    }
  });

  const getImpactColor = (value: number, isPositive: boolean = true) => {
    if (value === 0) return 'default';
    return (isPositive && value > 0) || (!isPositive && value < 0) ? 'success' : 'error';
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'enabled': return <CheckCircleIcon color="success" />;
      case 'disabled': return <ErrorIcon color="error" />;
      case 'rollout_changed': return <TrendingUpIcon color="info" />;
      case 'error': return <WarningIcon color="warning" />;
      default: return <InfoIcon />;
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  // Prepare chart data
  const chartData = metricsData?.trends?.map(trend => ({
    date: new Date(trend.date).toLocaleDateString(),
    evaluations: trend.evaluations,
    uniqueUsers: trend.uniqueUsers,
    errorRate: trend.errorRate * 100
  })) || [];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon />
            Impact Analysis for {featureFlagKey}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setHistoryOpen(true)}
            >
              View History
            </Button>
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={() => setRollbackOpen(true)}
            >
              Rollback
            </Button>
          </Box>
        </Box>

        {/* Date Range Selector */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <DatePicker
              label="Start Date"
              value={dateRange.startDate}
              onChange={(date) => date && setDateRange({ ...dateRange, startDate: date })}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <DatePicker
              label="End Date"
              value={dateRange.endDate}
              onChange={(date) => date && setDateRange({ ...dateRange, endDate: date })}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Quick Range</InputLabel>
              <Select
                value=""
                onChange={(e) => {
                  const days = parseInt(e.target.value as string);
                  if (days) {
                    setDateRange({
                      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                      endDate: new Date()
                    });
                  }
                }}
                label="Quick Range"
              >
                <MenuItem value={1}>Last 24 hours</MenuItem>
                <MenuItem value={7}>Last 7 days</MenuItem>
                <MenuItem value={30}>Last 30 days</MenuItem>
                <MenuItem value={90}>Last 90 days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Impact Metrics */}
        {impactData && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{formatNumber(impactData.metrics.totalUsers)}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Users</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2">
                      {formatNumber(impactData.metrics.enabledUsers)} enabled
                    </Typography>
                    <Chip
                      label={formatPercentage(impactData.metrics.enabledUsers / impactData.metrics.totalUsers)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{formatPercentage(impactData.metrics.conversionRate)}</Typography>
                  <Typography variant="body2" color="textSecondary">Conversion Rate</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {impactData.metrics.conversionRate > 0 ? (
                      <TrendingUpIcon color="success" />
                    ) : (
                      <TrendingDownIcon color="error" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{formatPercentage(impactData.metrics.errorRate)}</Typography>
                  <Typography variant="body2" color="textSecondary">Error Rate</Typography>
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={impactData.metrics.errorRate * 100}
                      color={impactData.metrics.errorRate > 0.05 ? 'error' : 'success'}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{impactData.metrics.performanceImpact.toFixed(1)}ms</Typography>
                  <Typography variant="body2" color="textSecondary">Performance Impact</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Chip
                      label={impactData.metrics.performanceImpact > 0 ? 'Slower' : 'Faster'}
                      color={getImpactColor(impactData.metrics.performanceImpact, false)}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Usage Metrics */}
        {metricsData && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{formatNumber(metricsData.usage.totalEvaluations)}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Evaluations</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{formatNumber(metricsData.usage.uniqueUsers)}</Typography>
                  <Typography variant="body2" color="textSecondary">Unique Users</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{metricsData.performance.averageLatency.toFixed(1)}ms</Typography>
                  <Typography variant="body2" color="textSecondary">Avg Latency</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{formatPercentage(metricsData.performance.cacheHitRate)}</Typography>
                  <Typography variant="body2" color="textSecondary">Cache Hit Rate</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Usage Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="evaluations" stroke="#8884d8" name="Evaluations" />
                  <Line type="monotone" dataKey="uniqueUsers" stroke="#82ca9d" name="Unique Users" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Error Rate Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Error Rate']} />
                  <Bar dataKey="errorRate" fill="#ff7300" name="Error Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Recent Events */}
        {impactData?.events && impactData.events.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Events
            </Typography>
            <List>
              {impactData.events.slice(0, 10).map((event, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {getEventIcon(event.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={event.type.replace('_', ' ').toUpperCase()}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(event.timestamp).toLocaleString()}
                          </Typography>
                          {event.details && Object.keys(event.details).length > 0 && (
                            <Typography variant="body2">
                              {JSON.stringify(event.details, null, 2)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < impactData.events.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        {/* History Dialog */}
        <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Feature Flag History</DialogTitle>
          <DialogContent>
            {historyData && historyData.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Version</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Changes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyData.map((entry) => (
                      <TableRow key={entry.version}>
                        <TableCell>{entry.version}</TableCell>
                        <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip label={entry.action} size="small" />
                        </TableCell>
                        <TableCell>{entry.user}</TableCell>
                        <TableCell>
                          <Typography variant="body2" component="pre">
                            {JSON.stringify(entry.changes, null, 2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No history available</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Rollback Dialog */}
        <Dialog open={rollbackOpen} onClose={() => setRollbackOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Rollback Feature Flag</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Rolling back will revert the feature flag to a previous version. This action cannot be undone.
            </Alert>
            <FormControl fullWidth>
              <InputLabel>Select Version</InputLabel>
              <Select
                value={selectedVersion || ''}
                onChange={(e) => setSelectedVersion(e.target.value as number)}
                label="Select Version"
              >
                {historyData?.map((entry) => (
                  <MenuItem key={entry.version} value={entry.version}>
                    Version {entry.version} - {entry.action} ({new Date(entry.timestamp).toLocaleDateString()})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRollbackOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedVersion && rollbackMutation.mutate(selectedVersion)}
              color="warning"
              variant="contained"
              disabled={!selectedVersion || rollbackMutation.isPending}
            >
              {rollbackMutation.isPending ? 'Rolling back...' : 'Rollback'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default FeatureFlagImpactTracker;