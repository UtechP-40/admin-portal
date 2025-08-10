import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Search,
  Download,
  Refresh,
  FilterList,
  PlayArrow,
  Pause,
  Clear,
  Visibility,
  GetApp,
  Analytics,
  Notifications,
  TrendingUp,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LineChart, BarChart } from '../charts';
import { analyticsService } from '../../services/analytics';
import type { LogEntry, LogStreamOptions } from '../../services/analytics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdvancedLogSearch from './AdvancedLogSearch';
import LogAlertingSystem from './LogAlertingSystem';

interface LoggingDashboardProps {
  startDate: Date;
  endDate: Date;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`logging-tabpanel-${index}`}
      aria-labelledby={`logging-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const LoggingDashboard: React.FC<LoggingDashboardProps> = ({ startDate, endDate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [logOptions, setLogOptions] = useState<LogStreamOptions>({
    level: '',
    category: '',
    maxLines: 1000
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['logs', logOptions, searchQuery],
    queryFn: () => {
      if (searchQuery) {
        return analyticsService.searchLogs(searchQuery, logOptions);
      }
      return analyticsService.getLogs(logOptions);
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: logStats } = useQuery({
    queryKey: ['logStats', startDate, endDate],
    queryFn: () => analyticsService.executeCustomQuery({
      collection: 'error_logs',
      filters: {
        timestamp: { $gte: startDate, $lte: endDate }
      },
      aggregation: [
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 }
          }
        }
      ]
    }),
  });

  const { data: logTrends } = useQuery({
    queryKey: ['logTrends', startDate, endDate],
    queryFn: () => analyticsService.getTimeBasedAggregation(
      'error_logs',
      'count',
      startDate,
      endDate,
      'hour',
      false
    ),
  });

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleStartStreaming = async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = await analyticsService.streamLogs(logOptions, (logEntry) => {
        queryClient.setQueryData(['logs', logOptions, searchQuery], (oldData: LogEntry[] = []) => {
          return [logEntry, ...oldData.slice(0, logOptions.maxLines! - 1)];
        });
      });

      eventSourceRef.current = eventSource;
      setIsStreaming(true);

      eventSource.onerror = () => {
        setIsStreaming(false);
        eventSourceRef.current = null;
      };
    } catch (error) {
      console.error('Failed to start log streaming:', error);
    }
  };

  const handleStopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleDownloadLogs = async () => {
    try {
      const filePath = await analyticsService.downloadLogFile('admin.log', true);
      // Create download link
      const link = document.createElement('a');
      link.href = `/api/admin/logs/download/${encodeURIComponent(filePath)}`;
      link.download = 'admin-logs.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download logs:', error);
    }
  };

  const handleExportLogs = async () => {
    try {
      const result = await analyticsService.exportAnalyticsData(
        'error_logs',
        {
          timestamp: { $gte: startDate, $lte: endDate },
          ...(logOptions.level && { level: logOptions.level }),
          ...(logOptions.category && { category: logOptions.category })
        },
        {
          format: 'csv',
          filename: `logs_export_${new Date().toISOString().split('T')[0]}`,
          includeMetadata: true
        }
      );
      
      // Create download link
      const link = document.createElement('a');
      link.href = `/api/admin/analytics/download/${encodeURIComponent(result.filePath)}`;
      link.download = 'logs_export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const formatLogLevel = (level: string) => {
    const colors: Record<string, string> = {
      error: 'error',
      warn: 'warning',
      info: 'info',
      debug: 'default',
      verbose: 'default'
    };
    return (
      <Chip
        label={level.toUpperCase()}
        color={colors[level] as any}
        size="small"
        variant="outlined"
      />
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatLogStatsData = () => {
    if (!logStats) return [];
    return logStats.map((stat: any) => ({
      level: stat._id,
      count: stat.count
    }));
  };

  const formatLogTrendsData = () => {
    if (!logTrends?.current) return [];
    return logTrends.current.map((item: any) => ({
      time: item._id,
      logs: item.count
    }));
  };

  const paginatedLogs = logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Logging Dashboard
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Search />
                  Basic Logs
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Analytics />
                  Advanced Search
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Notifications />
                  Log Alerts
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUp />
                  Analytics
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Basic Logs Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Basic Log Viewer
            </Typography>
            <Box display="flex" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                }
                label="Auto Refresh"
              />
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFilterDialogOpen(true)}
              >
                Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadLogs}
              >
                Download
              </Button>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={handleExportLogs}
              >
                Export
              </Button>
            </Box>
          </Box>

      {/* Log Statistics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <BarChart
              data={formatLogStatsData()}
              title="Log Entries by Level"
              xKey="level"
              yKey="count"
              height={250}
              formatTooltip={(value, name) => [`${value} entries`, 'Count']}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <LineChart
              data={formatLogTrendsData()}
              title="Log Trends Over Time"
              xKey="time"
              yKey="logs"
              height={250}
              formatTooltip={(value, name) => [`${value} logs`, 'Count']}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Search and Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Level</InputLabel>
              <Select
                value={logOptions.level || ''}
                label="Level"
                onChange={(e) => setLogOptions({ ...logOptions, level: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="warn">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="debug">Debug</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={logOptions.category || ''}
                label="Category"
                onChange={(e) => setLogOptions({ ...logOptions, category: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="security">Security</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => refetch()}
                disabled={isLoading}
              >
                Refresh
              </Button>
              <Button
                variant={isStreaming ? "contained" : "outlined"}
                startIcon={isStreaming ? <Pause /> : <PlayArrow />}
                onClick={isStreaming ? handleStopStreaming : handleStartStreaming}
                color={isStreaming ? "secondary" : "primary"}
              >
                {isStreaming ? 'Stop' : 'Stream'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={() => {
                  setSearchQuery('');
                  setLogOptions({ level: '', category: '', maxLines: 1000 });
                }}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Streaming Status */}
      {isStreaming && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Live log streaming is active. New log entries will appear automatically.
        </Alert>
      )}

      {/* Log Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.map((log, index) => (
                <TableRow key={`${log.timestamp}-${index}`} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {formatTimestamp(log.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {formatLogLevel(log.level)}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {log.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={log.source} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={logs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Log Detail Dialog */}
      <Dialog
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Log Entry Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Timestamp
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {formatTimestamp(selectedLog.timestamp)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Level
                  </Typography>
                  {formatLogLevel(selectedLog.level)}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Source
                  </Typography>
                  <Chip label={selectedLog.source} size="small" variant="outlined" />
                </Grid>
                {selectedLog.correlationId && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Correlation ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedLog.correlationId}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Message
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {selectedLog.message}
                    </Typography>
                  </Paper>
                </Grid>
                {selectedLog.metadata && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Metadata
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Advanced Filters</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Start Time"
                  value={logOptions.startTime || null}
                  onChange={(date) => setLogOptions({ ...logOptions, startTime: date || undefined })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Time"
                  value={logOptions.endTime || null}
                  onChange={(date) => setLogOptions({ ...logOptions, endTime: date || undefined })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Max Lines"
                value={logOptions.maxLines || 1000}
                onChange={(e) => setLogOptions({ ...logOptions, maxLines: parseInt(e.target.value) || 1000 })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setFilterDialogOpen(false);
              refetch();
            }}
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
        </TabPanel>

        {/* Advanced Search Tab */}
        <TabPanel value={activeTab} index={1}>
          <AdvancedLogSearch
            onLogSelect={setSelectedLog}
            realTimeEnabled={true}
          />
        </TabPanel>

        {/* Log Alerts Tab */}
        <TabPanel value={activeTab} index={2}>
          <LogAlertingSystem />
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <BarChart
                  data={formatLogStatsData()}
                  title="Log Entries by Level"
                  xKey="level"
                  yKey="count"
                  height={300}
                  formatTooltip={(value, name) => [`${value} entries`, 'Count']}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <LineChart
                  data={formatLogTrendsData()}
                  title="Log Trends Over Time"
                  xKey="time"
                  yKey="logs"
                  height={300}
                  formatTooltip={(value, name) => [`${value} logs`, 'Count']}
                />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Log Analytics Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {logs.length.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Logs
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error">
                        {logs.filter(log => log.level === 'error').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Error Logs
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning">
                        {logs.filter(log => log.level === 'warn').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Warning Logs
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success">
                        {logs.filter(log => log.level === 'info').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Info Logs
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Log Detail Dialog - Shared across tabs */}
      <Dialog
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Log Entry Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Timestamp
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {formatTimestamp(selectedLog.timestamp)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Level
                  </Typography>
                  {formatLogLevel(selectedLog.level)}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Source
                  </Typography>
                  <Chip label={selectedLog.source} size="small" variant="outlined" />
                </Grid>
                {selectedLog.correlationId && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Correlation ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedLog.correlationId}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Message
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {selectedLog.message}
                    </Typography>
                  </Paper>
                </Grid>
                {selectedLog.metadata && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Metadata
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Advanced Filters</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Start Time"
                  value={logOptions.startTime || null}
                  onChange={(date) => setLogOptions({ ...logOptions, startTime: date || undefined })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Time"
                  value={logOptions.endTime || null}
                  onChange={(date) => setLogOptions({ ...logOptions, endTime: date || undefined })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Max Lines"
                value={logOptions.maxLines || 1000}
                onChange={(e) => setLogOptions({ ...logOptions, maxLines: parseInt(e.target.value) || 1000 })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setFilterDialogOpen(false);
              refetch();
            }}
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoggingDashboard;