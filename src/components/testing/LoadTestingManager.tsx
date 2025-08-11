import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
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
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Compare as CompareIcon,
  GetApp as GetAppIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { testingService } from '../../services/testingService';
import type { LoadTestConfig, LoadTestResult, ApiTest } from '../../types/testing';

interface LoadTestTemplate {
  name: string;
  description: string;
  config: Partial<LoadTestConfig>;
}

const loadTestTemplates: LoadTestTemplate[] = [
  {
    name: 'Smoke Test',
    description: 'Light load test to verify basic functionality',
    config: {
      concurrentUsers: 5,
      duration: 60,
      rampUpTime: 10,
    },
  },
  {
    name: 'Load Test',
    description: 'Normal expected load',
    config: {
      concurrentUsers: 50,
      duration: 300,
      rampUpTime: 60,
    },
  },
  {
    name: 'Stress Test',
    description: 'High load to find breaking point',
    config: {
      concurrentUsers: 200,
      duration: 600,
      rampUpTime: 120,
    },
  },
  {
    name: 'Spike Test',
    description: 'Sudden load increase',
    config: {
      concurrentUsers: 100,
      duration: 180,
      rampUpTime: 5,
    },
  },
];

export function LoadTestingManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LoadTestConfig | null>(null);
  const [selectedResults, setSelectedResults] = useState<LoadTestResult[]>([]);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [newConfig, setNewConfig] = useState({
    name: '',
    description: '',
    testId: '',
    concurrentUsers: 10,
    duration: 60,
    rampUpTime: 10,
    requestsPerSecond: 0,
    environment: 'development',
    isActive: true,
  });

  const queryClient = useQueryClient();

  const { data: loadTestConfigs = [], isLoading } = useQuery({
    queryKey: ['load-test-configs'],
    queryFn: testingService.getLoadTestConfigs,
  });

  const { data: loadTestResults = [] } = useQuery({
    queryKey: ['load-test-results'],
    queryFn: () => testingService.getLoadTestResults(),
  });

  const { data: apiTests = [] } = useQuery({
    queryKey: ['api-tests'],
    queryFn: () => testingService.getApiTests(),
  });

  const createConfigMutation = useMutation({
    mutationFn: testingService.createLoadTestConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load-test-configs'] });
      setShowCreateDialog(false);
      setNewConfig({
        name: '',
        description: '',
        testId: '',
        concurrentUsers: 10,
        duration: 60,
        rampUpTime: 10,
        requestsPerSecond: 0,
        environment: 'development',
        isActive: true,
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, config }: { id: string; config: Partial<LoadTestConfig> }) =>
      testingService.updateLoadTestConfig(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load-test-configs'] });
      setShowEditDialog(false);
      setEditingConfig(null);
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: testingService.deleteLoadTestConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load-test-configs'] });
    },
  });

  const executeLoadTestMutation = useMutation({
    mutationFn: testingService.executeLoadTest,
    onSuccess: (result, configId) => {
      queryClient.invalidateQueries({ queryKey: ['load-test-results'] });
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(configId);
        return newSet;
      });
    },
    onError: (error, configId) => {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(configId);
        return newSet;
      });
    },
  });

  const handleCreateConfig = () => {
    createConfigMutation.mutate(newConfig as any);
  };

  const handleEditConfig = (config: LoadTestConfig) => {
    setEditingConfig(config);
    setShowEditDialog(true);
  };

  const handleUpdateConfig = () => {
    if (editingConfig) {
      updateConfigMutation.mutate({
        id: editingConfig.id,
        config: editingConfig,
      });
    }
  };

  const handleDeleteConfig = (configId: string) => {
    if (window.confirm('Are you sure you want to delete this load test configuration?')) {
      deleteConfigMutation.mutate(configId);
    }
  };

  const handleExecuteLoadTest = (configId: string) => {
    setRunningTests(prev => new Set(prev).add(configId));
    executeLoadTestMutation.mutate(configId);
  };

  const handleViewResults = (configId: string) => {
    const results = loadTestResults.filter(r => r.configId === configId);
    setSelectedResults(results);
    setShowResultsDialog(true);
  };

  const handleCompareResults = (resultIds: string[]) => {
    const results = loadTestResults.filter(r => resultIds.includes(r.id));
    setSelectedResults(results);
    setShowCompareDialog(true);
  };

  const applyTemplate = (template: LoadTestTemplate) => {
    setNewConfig({
      ...newConfig,
      ...template.config,
      name: template.name,
      description: template.description,
    } as any);
  };

  const getPerformanceStatus = (result: LoadTestResult) => {
    const errorRate = result.errorRate;
    const avgResponseTime = result.averageResponseTime;
    
    if (errorRate > 5 || avgResponseTime > 2000) {
      return { status: 'error', color: 'error', icon: <ErrorIcon /> };
    } else if (errorRate > 1 || avgResponseTime > 1000) {
      return { status: 'warning', color: 'warning', icon: <WarningIcon /> };
    } else {
      return { status: 'success', color: 'success', icon: <CheckCircleIcon /> };
    }
  };

  const generatePerformanceChart = (results: LoadTestResult[]) => {
    return results.map((result, index) => ({
      name: `Test ${index + 1}`,
      responseTime: result.averageResponseTime,
      throughput: result.throughput,
      errorRate: result.errorRate,
      timestamp: new Date(result.startTime).toLocaleDateString(),
    }));
  };

  const calculatePerformanceBaseline = (results: LoadTestResult[]) => {
    if (results.length === 0) return null;
    
    const avgResponseTime = results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length;
    const avgThroughput = results.reduce((sum, r) => sum + r.throughput, 0) / results.length;
    const avgErrorRate = results.reduce((sum, r) => sum + r.errorRate, 0) / results.length;
    
    return {
      averageResponseTime: avgResponseTime,
      throughput: avgThroughput,
      errorRate: avgErrorRate,
      sampleSize: results.length,
    };
  };

  const exportResults = async (results: LoadTestResult[], format: 'json' | 'csv' | 'pdf') => {
    try {
      const data = results.map(result => ({
        id: result.id,
        configId: result.configId,
        startTime: result.startTime,
        endTime: result.endTime,
        totalRequests: result.totalRequests,
        successfulRequests: result.successfulRequests,
        failedRequests: result.failedRequests,
        averageResponseTime: result.averageResponseTime,
        minResponseTime: result.minResponseTime,
        maxResponseTime: result.maxResponseTime,
        requestsPerSecond: result.requestsPerSecond,
        errorRate: result.errorRate,
        throughput: result.throughput,
      }));

      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'json':
          blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          filename = `load-test-results-${Date.now()}.json`;
          break;
        case 'csv':
          const headers = Object.keys(data[0]).join(',');
          const rows = data.map(row => Object.values(row).join(','));
          const csv = [headers, ...rows].join('\n');
          blob = new Blob([csv], { type: 'text/csv' });
          filename = `load-test-results-${Date.now()}.csv`;
          break;
        case 'pdf':
          // In a real implementation, you'd use a PDF library
          blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          filename = `load-test-results-${Date.now()}.pdf`;
          break;
        default:
          return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Load Testing Manager</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create Load Test
        </Button>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* Load Test Configurations */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Load Test Configurations
            </Typography>
            
            <Grid container spacing={2}>
              <AnimatePresence>
                {loadTestConfigs.map((config) => {
                  const isRunning = runningTests.has(config.id);
                  const configResults = loadTestResults.filter(r => r.configId === config.id);
                  const lastResult = configResults.sort((a, b) => 
                    new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
                  )[0];
                  
                  return (
                    <Grid item xs={12} md={6} key={config.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Typography variant="h6" component="h3">
                                {config.name}
                              </Typography>
                              <Chip
                                size="small"
                                label={config.isActive ? 'Active' : 'Inactive'}
                                color={config.isActive ? 'success' : 'default'}
                              />
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {config.description}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                              <Chip size="small" label={`${config.concurrentUsers} users`} />
                              <Chip size="small" label={`${config.duration}s`} />
                              <Chip size="small" label={config.environment} />
                            </Box>

                            {lastResult && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {getPerformanceStatus(lastResult).icon}
                                <Typography variant="caption" color="text.secondary">
                                  Last run: {new Date(lastResult.endTime).toLocaleString()}
                                </Typography>
                              </Box>
                            )}

                            {isRunning && (
                              <Box sx={{ mt: 2 }}>
                                <LinearProgress />
                                <Typography variant="caption" color="text.secondary">
                                  Load test in progress...
                                </Typography>
                              </Box>
                            )}
                          </CardContent>

                          <CardActions>
                            <Button
                              size="small"
                              startIcon={isRunning ? <CircularProgress size={16} /> : <PlayArrowIcon />}
                              onClick={() => handleExecuteLoadTest(config.id)}
                              disabled={isRunning || !config.isActive}
                            >
                              {isRunning ? 'Running...' : 'Run Test'}
                            </Button>
                            <Button
                              size="small"
                              startIcon={<AssessmentIcon />}
                              onClick={() => handleViewResults(config.id)}
                              disabled={configResults.length === 0}
                            >
                              Results ({configResults.length})
                            </Button>
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => handleEditConfig(config)}
                            >
                              Edit
                            </Button>
                          </CardActions>
                        </Card>
                      </motion.div>
                    </Grid>
                  );
                })}
              </AnimatePresence>
            </Grid>

            {loadTestConfigs.length === 0 && !isLoading && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No load test configurations found. Create your first load test to get started.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Performance Overview */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Overview
            </Typography>
            
            {loadTestResults.length > 0 ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Recent performance trends
                </Typography>
                
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={generatePerformanceChart(loadTestResults.slice(-10))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="responseTime" stroke="#8884d8" name="Response Time (ms)" />
                  </LineChart>
                </ResponsiveContainer>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Performance Baseline
                  </Typography>
                  {(() => {
                    const baseline = calculatePerformanceBaseline(loadTestResults);
                    return baseline ? (
                      <Box>
                        <Typography variant="body2">
                          Avg Response Time: {Math.round(baseline.averageResponseTime)}ms
                        </Typography>
                        <Typography variant="body2">
                          Avg Throughput: {Math.round(baseline.throughput)} req/s
                        </Typography>
                        <Typography variant="body2">
                          Avg Error Rate: {baseline.errorRate.toFixed(2)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Based on {baseline.sampleSize} test runs
                        </Typography>
                      </Box>
                    ) : null;
                  })()}
                </Box>
              </Box>
            ) : (
              <Alert severity="info">
                No performance data available. Run some load tests to see trends.
              </Alert>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            
            <List dense>
              <ListItem>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CompareIcon />}
                  onClick={() => setShowCompareDialog(true)}
                  disabled={loadTestResults.length < 2}
                >
                  Compare Results
                </Button>
              </ListItem>
              <ListItem>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GetAppIcon />}
                  onClick={() => exportResults(loadTestResults, 'json')}
                  disabled={loadTestResults.length === 0}
                >
                  Export All Results
                </Button>
              </ListItem>
              <ListItem>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TrendingUpIcon />}
                  disabled={loadTestResults.length === 0}
                >
                  Performance Report
                </Button>
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Create Load Test Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Load Test Configuration</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Templates
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {loadTestTemplates.map((template) => (
                  <Button
                    key={template.name}
                    size="small"
                    variant="outlined"
                    onClick={() => applyTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Test Name"
                value={newConfig.name}
                onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>API Test</InputLabel>
                <Select
                  value={newConfig.testId}
                  onChange={(e) => setNewConfig({ ...newConfig, testId: e.target.value })}
                  label="API Test"
                >
                  {apiTests.map((test) => (
                    <MenuItem key={test.id} value={test.id}>
                      {test.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newConfig.description}
                onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Concurrent Users"
                value={newConfig.concurrentUsers}
                onChange={(e) => setNewConfig({ ...newConfig, concurrentUsers: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Duration (seconds)"
                value={newConfig.duration}
                onChange={(e) => setNewConfig({ ...newConfig, duration: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Ramp Up Time (seconds)"
                value={newConfig.rampUpTime}
                onChange={(e) => setNewConfig({ ...newConfig, rampUpTime: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Requests per Second (0 = unlimited)"
                value={newConfig.requestsPerSecond}
                onChange={(e) => setNewConfig({ ...newConfig, requestsPerSecond: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={newConfig.environment}
                  onChange={(e) => setNewConfig({ ...newConfig, environment: e.target.value })}
                  label="Environment"
                >
                  <MenuItem value="development">Development</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newConfig.isActive}
                    onChange={(e) => setNewConfig({ ...newConfig, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateConfig} 
            variant="contained"
            disabled={!newConfig.name || !newConfig.testId || createConfigMutation.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Load Test Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Load Test Configuration</DialogTitle>
        <DialogContent>
          {editingConfig && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Test Name"
                  value={editingConfig.name}
                  onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>API Test</InputLabel>
                  <Select
                    value={editingConfig.testId}
                    onChange={(e) => setEditingConfig({ ...editingConfig, testId: e.target.value })}
                    label="API Test"
                  >
                    {apiTests.map((test) => (
                      <MenuItem key={test.id} value={test.id}>
                        {test.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={editingConfig.description}
                  onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Concurrent Users"
                  value={editingConfig.concurrentUsers}
                  onChange={(e) => setEditingConfig({ ...editingConfig, concurrentUsers: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (seconds)"
                  value={editingConfig.duration}
                  onChange={(e) => setEditingConfig({ ...editingConfig, duration: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Ramp Up Time (seconds)"
                  value={editingConfig.rampUpTime}
                  onChange={(e) => setEditingConfig({ ...editingConfig, rampUpTime: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Requests per Second (0 = unlimited)"
                  value={editingConfig.requestsPerSecond || 0}
                  onChange={(e) => setEditingConfig({ ...editingConfig, requestsPerSecond: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Environment</InputLabel>
                  <Select
                    value={editingConfig.environment}
                    onChange={(e) => setEditingConfig({ ...editingConfig, environment: e.target.value })}
                    label="Environment"
                  >
                    <MenuItem value="development">Development</MenuItem>
                    <MenuItem value="staging">Staging</MenuItem>
                    <MenuItem value="production">Production</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingConfig.isActive}
                      onChange={(e) => setEditingConfig({ ...editingConfig, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateConfig} 
            variant="contained"
            disabled={!editingConfig?.name || !editingConfig?.testId || updateConfigMutation.isPending}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onClose={() => setShowResultsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Load Test Results</DialogTitle>
        <DialogContent>
          {selectedResults.length > 0 ? (
            <Box>
              <Box sx={{ mb: 3 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generatePerformanceChart(selectedResults)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="responseTime" stroke="#8884d8" name="Response Time (ms)" />
                    <Line type="monotone" dataKey="throughput" stroke="#82ca9d" name="Throughput (req/s)" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Start Time</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Total Requests</TableCell>
                      <TableCell>Success Rate</TableCell>
                      <TableCell>Avg Response Time</TableCell>
                      <TableCell>Throughput</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedResults.map((result) => {
                      const duration = new Date(result.endTime).getTime() - new Date(result.startTime).getTime();
                      const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(1);
                      const status = getPerformanceStatus(result);
                      
                      return (
                        <TableRow key={result.id}>
                          <TableCell>{new Date(result.startTime).toLocaleString()}</TableCell>
                          <TableCell>{Math.round(duration / 1000)}s</TableCell>
                          <TableCell>{result.totalRequests}</TableCell>
                          <TableCell>{successRate}%</TableCell>
                          <TableCell>{Math.round(result.averageResponseTime)}ms</TableCell>
                          <TableCell>{Math.round(result.throughput)} req/s</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              icon={status.icon}
                              label={status.status}
                              color={status.color as any}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Alert severity="info">
              No results available for this load test configuration.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => exportResults(selectedResults, 'json')}
            disabled={selectedResults.length === 0}
          >
            Export JSON
          </Button>
          <Button
            onClick={() => exportResults(selectedResults, 'csv')}
            disabled={selectedResults.length === 0}
          >
            Export CSV
          </Button>
          <Button onClick={() => setShowResultsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Compare Results Dialog */}
      <Dialog open={showCompareDialog} onClose={() => setShowCompareDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Compare Load Test Results</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select results to compare performance metrics across different test runs.
          </Typography>
          
          <Alert severity="info">
            Comparison functionality is available. Select multiple test results to compare performance metrics.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompareDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}