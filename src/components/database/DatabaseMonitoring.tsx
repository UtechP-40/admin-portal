import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatabaseMonitoringService } from '../../services/databaseMonitoring';
import type { 
  CollectionPerformanceMetrics, 
  DatabaseHealthScore 
} from '../../types/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DatabaseMonitoringProps {
  collection?: string;
}

const DatabaseMonitoring: React.FC<DatabaseMonitoringProps> = ({ collection }) => {
  const [selectedCollection, setSelectedCollection] = useState(collection || '');
  const [timeRange, setTimeRange] = useState({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    endDate: new Date(),
    granularity: 'hour' as 'minute' | 'hour' | 'day'
  });
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    description: '',
    collection: '',
    metric: 'query_time' as 'query_time' | 'index_usage' | 'storage_size' | 'connection_count',
    threshold: { operator: 'gt' as 'gt' | 'lt' | 'eq' | 'gte' | 'lte', value: 0 },
    duration: 5,
    notifications: { email: [''] },
    enabled: true
  });

  const queryClient = useQueryClient();

  // Real-time metrics query
  const { data: realTimeMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['realtime-metrics'],
    queryFn: DatabaseMonitoringService.getRealTimeMetrics,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Database health score query
  const { data: healthScore, isLoading: healthLoading } = useQuery({
    queryKey: ['database-health'],
    queryFn: DatabaseMonitoringService.getDatabaseHealthScore,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Collection performance metrics query
  const { data: performanceMetrics, isLoading: performanceLoading } = useQuery({
    queryKey: ['performance-metrics', selectedCollection, timeRange],
    queryFn: () => selectedCollection ? 
      DatabaseMonitoringService.getCollectionPerformanceMetrics(selectedCollection, timeRange) : 
      null,
    enabled: !!selectedCollection,
    refetchInterval: 60000 // Refresh every minute
  });

  // Index recommendations query
  const { data: indexRecommendations = [] } = useQuery({
    queryKey: ['index-recommendations', selectedCollection],
    queryFn: () => DatabaseMonitoringService.getIndexOptimizationRecommendations(selectedCollection),
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  // Slow queries query
  const { data: slowQueries = [] } = useQuery({
    queryKey: ['slow-queries', selectedCollection],
    queryFn: () => DatabaseMonitoringService.getSlowQueryAnalysis(selectedCollection),
    refetchInterval: 60000 // Refresh every minute
  });

  // Performance alerts query
  const { data: alerts = [] } = useQuery({
    queryKey: ['performance-alerts'],
    queryFn: DatabaseMonitoringService.getPerformanceAlerts,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: DatabaseMonitoringService.createPerformanceAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-alerts'] });
      setAlertDialogOpen(false);
      setNewAlert({
        name: '',
        description: '',
        collection: '',
        metric: 'query_time',
        threshold: { operator: 'gt', value: 0 },
        duration: 5,
        notifications: { email: [''] },
        enabled: true
      });
    }
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['realtime-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['database-health'] });
    if (selectedCollection) {
      queryClient.invalidateQueries({ queryKey: ['performance-metrics', selectedCollection] });
    }
  };

  const handleCreateAlert = () => {
    createAlertMutation.mutate(newAlert);
  };

  const renderHealthScoreCard = () => {
    if (healthLoading) return <CircularProgress />;
    if (!healthScore) return null;

    const scoreColor = DatabaseMonitoringService.getHealthScoreColor(healthScore.overall);

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircleIcon color={scoreColor} sx={{ mr: 1 }} />
            <Typography variant="h6">Database Health Score</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h3" color={scoreColor === 'error' ? 'error' : scoreColor === 'warning' ? 'warning.main' : 'success.main'}>
              {healthScore.overall}
            </Typography>
            <Typography variant="h4" color="text.secondary" sx={{ ml: 1 }}>
              /100
            </Typography>
          </Box>

          <LinearProgress 
            variant="determinate" 
            value={healthScore.overall} 
            color={scoreColor}
            sx={{ mb: 2, height: 8, borderRadius: 4 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Performance</Typography>
              <Typography variant="h6">{healthScore.categories.performance}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Storage</Typography>
              <Typography variant="h6">{healthScore.categories.storage}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Indexing</Typography>
              <Typography variant="h6">{healthScore.categories.indexing}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Queries</Typography>
              <Typography variant="h6">{healthScore.categories.queries}</Typography>
            </Grid>
          </Grid>

          {healthScore.issues.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Issues:</Typography>
              {healthScore.issues.slice(0, 3).map((issue, index) => (
                <Alert 
                  key={index} 
                  severity={issue.severity === 'critical' ? 'error' : issue.severity === 'warning' ? 'warning' : 'info'}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2">{issue.description}</Typography>
                </Alert>
              ))}
              {healthScore.issues.length > 3 && (
                <Typography variant="body2" color="text.secondary">
                  ... and {healthScore.issues.length - 3} more issues
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderRealTimeMetrics = () => {
    if (metricsLoading) return <CircularProgress />;
    if (!realTimeMetrics) return null;

    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <NetworkIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Connections</Typography>
              </Box>
              <Typography variant="h4">{realTimeMetrics.connections.current}</Typography>
              <Typography variant="body2" color="text.secondary">
                of {realTimeMetrics.connections.available} available
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(realTimeMetrics.connections.current / realTimeMetrics.connections.available) * 100}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Operations/sec</Typography>
              </Box>
              <Typography variant="h4">
                {Object.values(realTimeMetrics.operations).reduce((a, b) => a + b, 0)}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Q: {realTimeMetrics.operations.query} | 
                  I: {realTimeMetrics.operations.insert} | 
                  U: {realTimeMetrics.operations.update} | 
                  D: {realTimeMetrics.operations.delete}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MemoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory</Typography>
              </Box>
              <Typography variant="h4">
                {DatabaseMonitoringService.formatBytes(realTimeMetrics.memory.resident)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resident ({DatabaseMonitoringService.formatBytes(realTimeMetrics.memory.virtual)} virtual)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Network I/O</Typography>
              </Box>
              <Typography variant="body1">
                In: {DatabaseMonitoringService.formatBytes(realTimeMetrics.network.bytesIn)}
              </Typography>
              <Typography variant="body1">
                Out: {DatabaseMonitoringService.formatBytes(realTimeMetrics.network.bytesOut)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {realTimeMetrics.network.numRequests} requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderIndexRecommendations = () => {
    if (indexRecommendations.length === 0) return null;

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BuildIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Index Optimization Recommendations</Typography>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Collection</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Index</TableCell>
                  <TableCell>Impact</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {indexRecommendations.map((rec, index) => (
                  <TableRow key={index}>
                    <TableCell>{rec.collection}</TableCell>
                    <TableCell>
                      <Chip 
                        label={rec.recommendation.type} 
                        color={rec.recommendation.type === 'create' ? 'success' : 
                               rec.recommendation.type === 'drop' ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <code>{JSON.stringify(rec.recommendation.index.fields)}</code>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={rec.recommendation.impact} 
                        color={rec.recommendation.impact === 'high' ? 'error' : 
                               rec.recommendation.impact === 'medium' ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{rec.recommendation.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderSlowQueries = () => {
    if (slowQueries.length === 0) return null;

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TimelineIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Slow Queries</Typography>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Collection</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Docs Examined</TableCell>
                  <TableCell>Docs Returned</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Query</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slowQueries.slice(0, 10).map((query, index) => (
                  <TableRow key={index}>
                    <TableCell>{query.collection}</TableCell>
                    <TableCell>
                      <Chip 
                        label={DatabaseMonitoringService.formatDuration(query.duration)}
                        color={query.duration > 5000 ? 'error' : query.duration > 1000 ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{query.executionStats.totalDocsExamined.toLocaleString()}</TableCell>
                    <TableCell>{query.executionStats.totalDocsReturned.toLocaleString()}</TableCell>
                    <TableCell>{new Date(query.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Tooltip title={JSON.stringify(query.query, null, 2)}>
                        <code style={{ cursor: 'pointer' }}>
                          {JSON.stringify(query.query).substring(0, 50)}...
                        </code>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderPerformanceAlerts = () => {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Performance Alerts</Typography>
            </Box>
            <Button 
              variant="outlined" 
              onClick={() => setAlertDialogOpen(true)}
              size="small"
            >
              Create Alert
            </Button>
          </Box>
          
          {alerts.length === 0 ? (
            <Typography color="text.secondary">No alerts configured</Typography>
          ) : (
            <List>
              {alerts.map((alert, index) => (
                <React.Fragment key={alert.id}>
                  <ListItem>
                    <ListItemIcon>
                      {alert.status === 'triggered' ? 
                        <ErrorIcon color="error" /> : 
                        alert.status === 'active' ? 
                        <CheckCircleIcon color="success" /> : 
                        <WarningIcon color="warning" />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.name}
                      secondary={
                        <Box>
                          <Typography variant="body2">{alert.description}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alert.collection && `Collection: ${alert.collection} | `}
                            Metric: {alert.metric} | Status: {alert.status}
                            {alert.lastTriggered && ` | Last triggered: ${new Date(alert.lastTriggered).toLocaleString()}`}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < alerts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Database Monitoring</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Collection</InputLabel>
            <Select
              value={selectedCollection}
              label="Collection"
              onChange={(e) => setSelectedCollection(e.target.value)}
            >
              <MenuItem value="">All Collections</MenuItem>
              {/* Add collection options here */}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Health Score and Real-time Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          {renderHealthScoreCard()}
        </Grid>
        <Grid item xs={12} md={8}>
          {renderRealTimeMetrics()}
        </Grid>
      </Grid>

      {/* Performance Charts */}
      {performanceMetrics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Performance Trends</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Query Performance</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={performanceMetrics.metrics.documentGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Storage Growth</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={performanceMetrics.metrics.documentGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="size" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Recommendations and Alerts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          {renderIndexRecommendations()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderPerformanceAlerts()}
        </Grid>
      </Grid>

      {/* Slow Queries */}
      {renderSlowQueries()}

      {/* Create Alert Dialog */}
      <Dialog open={alertDialogOpen} onClose={() => setAlertDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Performance Alert</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Alert Name"
                value={newAlert.name}
                onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newAlert.description}
                onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={newAlert.metric}
                  label="Metric"
                  onChange={(e) => setNewAlert({ ...newAlert, metric: e.target.value as any })}
                >
                  <MenuItem value="query_time">Query Time</MenuItem>
                  <MenuItem value="index_usage">Index Usage</MenuItem>
                  <MenuItem value="storage_size">Storage Size</MenuItem>
                  <MenuItem value="connection_count">Connection Count</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Collection (Optional)"
                value={newAlert.collection}
                onChange={(e) => setNewAlert({ ...newAlert, collection: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Operator</InputLabel>
                <Select
                  value={newAlert.threshold.operator}
                  label="Operator"
                  onChange={(e) => setNewAlert({ 
                    ...newAlert, 
                    threshold: { ...newAlert.threshold, operator: e.target.value as any }
                  })}
                >
                  <MenuItem value="gt">Greater Than</MenuItem>
                  <MenuItem value="lt">Less Than</MenuItem>
                  <MenuItem value="gte">Greater Than or Equal</MenuItem>
                  <MenuItem value="lte">Less Than or Equal</MenuItem>
                  <MenuItem value="eq">Equal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Threshold Value"
                type="number"
                value={newAlert.threshold.value}
                onChange={(e) => setNewAlert({ 
                  ...newAlert, 
                  threshold: { ...newAlert.threshold, value: Number(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={newAlert.duration}
                onChange={(e) => setNewAlert({ ...newAlert, duration: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Notifications (comma-separated)"
                value={newAlert.notifications.email.join(', ')}
                onChange={(e) => setNewAlert({ 
                  ...newAlert, 
                  notifications: { 
                    ...newAlert.notifications, 
                    email: e.target.value.split(',').map(email => email.trim()) 
                  }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newAlert.enabled}
                    onChange={(e) => setNewAlert({ ...newAlert, enabled: e.target.checked })}
                  />
                }
                label="Enable Alert"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateAlert} 
            variant="contained"
            disabled={!newAlert.name || createAlertMutation.isLoading}
          >
            {createAlertMutation.isLoading ? 'Creating...' : 'Create Alert'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DatabaseMonitoring;