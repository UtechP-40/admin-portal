import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  Slider,
  Autocomplete,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  ExpandMore,
  Save,
  History,
  TrendingUp,
  Warning,
  Error,
  Info,
  CheckCircle,
  Timeline,
  Analytics,
  Download,
  Refresh,
  PlayArrow,
  Pause,
  Settings,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { analyticsService, LogEntry } from '../../services/analytics';

export interface LogSearchQuery {
  query: string;
  level?: string;
  category?: string;
  source?: string;
  startTime?: Date;
  endTime?: Date;
  correlationId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface LogPattern {
  id: string;
  name: string;
  pattern: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  lastSeen: Date;
  examples: LogEntry[];
}

export interface LogAnomaly {
  id: string;
  type: 'frequency' | 'pattern' | 'error_rate' | 'response_time';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  affectedLogs: LogEntry[];
  confidence: number;
  baseline?: number;
  current?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: LogSearchQuery;
  createdAt: Date;
  lastUsed: Date;
}

const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
const LOG_CATEGORIES = ['auth', 'api', 'database', 'game', 'system', 'security'];
const LOG_SOURCES = ['backend', 'frontend', 'database', 'nginx', 'redis'];

const QUERY_OPERATORS = [
  { value: 'AND', label: 'AND', description: 'Both conditions must be true' },
  { value: 'OR', label: 'OR', description: 'Either condition can be true' },
  { value: 'NOT', label: 'NOT', description: 'Exclude matching logs' },
  { value: 'NEAR', label: 'NEAR', description: 'Terms within proximity' },
  { value: 'REGEX', label: 'REGEX', description: 'Regular expression match' },
];

const SAMPLE_PATTERNS = [
  {
    id: 'failed_login',
    name: 'Failed Login Attempts',
    pattern: 'level:error AND message:"authentication failed"',
    description: 'Detect failed authentication attempts',
    severity: 'high' as const,
  },
  {
    id: 'slow_queries',
    name: 'Slow Database Queries',
    pattern: 'category:database AND message:"slow query" AND duration:>1000',
    description: 'Identify slow database operations',
    severity: 'medium' as const,
  },
  {
    id: 'memory_warnings',
    name: 'Memory Usage Warnings',
    pattern: 'level:warn AND message:"memory usage"',
    description: 'Monitor memory usage warnings',
    severity: 'medium' as const,
  },
];

export interface AdvancedLogSearchProps {
  onLogSelect?: (log: LogEntry) => void;
  onPatternDetected?: (pattern: LogPattern) => void;
  onAnomalyDetected?: (anomaly: LogAnomaly) => void;
  realTimeEnabled?: boolean;
}

const AdvancedLogSearch: React.FC<AdvancedLogSearchProps> = ({
  onLogSelect,
  onPatternDetected,
  onAnomalyDetected,
  realTimeEnabled = false,
}) => {
  const [query, setQuery] = useState<LogSearchQuery>({
    query: '',
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    endTime: new Date(),
    limit: 100,
    offset: 0,
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [patterns, setPatterns] = useState<LogPattern[]>([]);
  const [anomalies, setAnomalies] = useState<LogAnomaly[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realTimeActive, setRealTimeActive] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  const [queryBuilderOpen, setQueryBuilderOpen] = useState(false);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [patternAnalysisOpen, setPatternAnalysisOpen] = useState(false);
  const [anomalyDetectionOpen, setAnomalyDetectionOpen] = useState(false);

  // Real-time log streaming
  useEffect(() => {
    if (!realTimeEnabled || !realTimeActive) return;

    const eventSource = analyticsService.streamLogs(
      {
        level: query.level,
        category: query.category,
        startTime: query.startTime,
        maxLines: 1000,
      },
      (newLog: LogEntry) => {
        setLogs(prev => [newLog, ...prev.slice(0, 999)]);
      }
    );

    return () => {
      eventSource.then(source => source.close());
    };
  }, [realTimeEnabled, realTimeActive, query.level, query.category, query.startTime]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleSearch();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, query]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const searchResults = await analyticsService.searchLogs(query.query, {
        level: query.level,
        category: query.category,
        startTime: query.startTime,
        endTime: query.endTime,
        maxLines: query.limit,
      });

      setLogs(searchResults);

      // Trigger pattern analysis
      if (searchResults.length > 0) {
        await analyzePatterns(searchResults);
        await detectAnomalies(searchResults);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const analyzePatterns = async (logEntries: LogEntry[]) => {
    try {
      // Simple pattern analysis - in a real implementation, this would be more sophisticated
      const patternCounts = new Map<string, { count: number; examples: LogEntry[] }>();

      logEntries.forEach(log => {
        // Extract common patterns
        const patterns = [
          log.level,
          log.source,
          log.message.split(' ')[0], // First word
          log.correlationId ? 'has_correlation' : 'no_correlation',
        ];

        patterns.forEach(pattern => {
          if (!patternCounts.has(pattern)) {
            patternCounts.set(pattern, { count: 0, examples: [] });
          }
          const entry = patternCounts.get(pattern)!;
          entry.count++;
          if (entry.examples.length < 3) {
            entry.examples.push(log);
          }
        });
      });

      const detectedPatterns: LogPattern[] = Array.from(patternCounts.entries())
        .filter(([_, data]) => data.count > 5) // Only patterns with significant frequency
        .map(([pattern, data]) => ({
          id: `pattern_${pattern}_${Date.now()}`,
          name: `Pattern: ${pattern}`,
          pattern: pattern,
          description: `Detected ${data.count} occurrences of pattern "${pattern}"`,
          severity: data.count > 50 ? 'high' : data.count > 20 ? 'medium' : 'low',
          count: data.count,
          lastSeen: new Date(),
          examples: data.examples,
        }));

      setPatterns(detectedPatterns);
      
      // Notify about significant patterns
      detectedPatterns
        .filter(p => p.severity === 'high' || p.severity === 'critical')
        .forEach(pattern => onPatternDetected?.(pattern));

    } catch (error) {
      console.error('Pattern analysis failed:', error);
    }
  };

  const detectAnomalies = async (logEntries: LogEntry[]) => {
    try {
      const detectedAnomalies: LogAnomaly[] = [];

      // Error rate anomaly detection
      const errorLogs = logEntries.filter(log => log.level === 'error');
      const errorRate = errorLogs.length / logEntries.length;
      
      if (errorRate > 0.1) { // More than 10% errors
        detectedAnomalies.push({
          id: `anomaly_error_rate_${Date.now()}`,
          type: 'error_rate',
          description: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
          severity: errorRate > 0.3 ? 'critical' : errorRate > 0.2 ? 'high' : 'medium',
          detectedAt: new Date(),
          affectedLogs: errorLogs,
          confidence: 0.9,
          baseline: 0.05, // 5% baseline
          current: errorRate,
        });
      }

      // Frequency anomaly detection
      const logFrequency = logEntries.length / ((query.endTime!.getTime() - query.startTime!.getTime()) / (1000 * 60)); // logs per minute
      
      if (logFrequency > 100) { // More than 100 logs per minute
        detectedAnomalies.push({
          id: `anomaly_frequency_${Date.now()}`,
          type: 'frequency',
          description: `Unusual log frequency: ${logFrequency.toFixed(1)} logs/minute`,
          severity: logFrequency > 500 ? 'critical' : logFrequency > 200 ? 'high' : 'medium',
          detectedAt: new Date(),
          affectedLogs: logEntries.slice(0, 10),
          confidence: 0.8,
          baseline: 50,
          current: logFrequency,
        });
      }

      setAnomalies(detectedAnomalies);
      
      // Notify about anomalies
      detectedAnomalies.forEach(anomaly => onAnomalyDetected?.(anomaly));

    } catch (error) {
      console.error('Anomaly detection failed:', error);
    }
  };

  const handleSaveSearch = async (name: string) => {
    const savedSearch: SavedSearch = {
      id: `search_${Date.now()}`,
      name,
      query: { ...query },
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    setSavedSearches(prev => [...prev, savedSearch]);
    setSaveSearchOpen(false);
  };

  const handleLoadSearch = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    // Update last used
    setSavedSearches(prev =>
      prev.map(s => s.id === savedSearch.id ? { ...s, lastUsed: new Date() } : s)
    );
  };

  const buildQueryFromFilters = () => {
    const parts: string[] = [];

    if (query.level) parts.push(`level:${query.level}`);
    if (query.category) parts.push(`category:${query.category}`);
    if (query.source) parts.push(`source:${query.source}`);
    if (query.correlationId) parts.push(`correlationId:${query.correlationId}`);
    if (query.userId) parts.push(`userId:${query.userId}`);

    return parts.join(' AND ');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Error color="error" />;
      case 'high':
        return <Warning color="warning" />;
      case 'medium':
        return <Info color="info" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'success';
    }
  };

  const formatLogLevel = (level: string) => {
    const colors = {
      debug: '#9e9e9e',
      info: '#2196f3',
      warn: '#ff9800',
      error: '#f44336',
      fatal: '#d32f2f',
    };
    return { color: colors[level as keyof typeof colors] || '#000' };
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h5" gutterBottom>
          Advanced Log Search & Analysis
        </Typography>

        {/* Search Interface */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search Query"
                value={query.query}
                onChange={(e) => setQuery({ ...query, query: e.target.value })}
                placeholder="Enter search terms or use query language..."
                InputProps={{
                  endAdornment: (
                    <Box display="flex" gap={1}>
                      <Tooltip title="Query Builder">
                        <IconButton onClick={() => setQueryBuilderOpen(true)}>
                          <FilterList />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Clear">
                        <IconButton onClick={() => setQuery({ ...query, query: '' })}>
                          <Clear />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DateTimePicker
                label="Start Time"
                value={query.startTime}
                onChange={(date) => setQuery({ ...query, startTime: date || undefined })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DateTimePicker
                label="End Time"
                value={query.endTime}
                onChange={(date) => setQuery({ ...query, endTime: date || undefined })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={query.level || ''}
                    label="Level"
                    onChange={(e) => setQuery({ ...query, level: e.target.value || undefined })}
                  >
                    <MenuItem value="">All</MenuItem>
                    {LOG_LEVELS.map(level => (
                      <MenuItem key={level} value={level}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              ...formatLogLevel(level),
                              bgcolor: 'currentColor',
                            }}
                          />
                          {level.toUpperCase()}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={query.category || ''}
                    label="Category"
                    onChange={(e) => setQuery({ ...query, category: e.target.value || undefined })}
                  >
                    <MenuItem value="">All</MenuItem>
                    {LOG_CATEGORIES.map(category => (
                      <MenuItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Source</InputLabel>
                  <Select
                    value={query.source || ''}
                    label="Source"
                    onChange={(e) => setQuery({ ...query, source: e.target.value || undefined })}
                  >
                    <MenuItem value="">All</MenuItem>
                    {LOG_SOURCES.map(source => (
                      <MenuItem key={source} value={source}>
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={handleSearch}
                  disabled={loading}
                >
                  Search
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={() => setSaveSearchOpen(true)}
                  disabled={!query.query}
                >
                  Save
                </Button>

                {realTimeEnabled && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={realTimeActive}
                        onChange={(e) => setRealTimeActive(e.target.checked)}
                      />
                    }
                    label="Real-time"
                  />
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                  }
                  label="Auto-refresh"
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Analysis Panels */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Patterns */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Detected Patterns
                    <Badge badgeContent={patterns.length} color="primary" sx={{ ml: 1 }} />
                  </Typography>
                  <IconButton onClick={() => setPatternAnalysisOpen(true)}>
                    <Analytics />
                  </IconButton>
                </Box>
                <List dense>
                  {patterns.slice(0, 3).map((pattern) => (
                    <ListItem key={pattern.id}>
                      <ListItemIcon>
                        {getSeverityIcon(pattern.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={pattern.name}
                        secondary={`${pattern.count} occurrences`}
                      />
                    </ListItem>
                  ))}
                </List>
                {patterns.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    +{patterns.length - 3} more patterns
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Anomalies */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Anomalies
                    <Badge badgeContent={anomalies.length} color="error" sx={{ ml: 1 }} />
                  </Typography>
                  <IconButton onClick={() => setAnomalyDetectionOpen(true)}>
                    <TrendingUp />
                  </IconButton>
                </Box>
                <List dense>
                  {anomalies.slice(0, 3).map((anomaly) => (
                    <ListItem key={anomaly.id}>
                      <ListItemIcon>
                        {getSeverityIcon(anomaly.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={anomaly.description}
                        secondary={`Confidence: ${(anomaly.confidence * 100).toFixed(0)}%`}
                      />
                    </ListItem>
                  ))}
                </List>
                {anomalies.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    +{anomalies.length - 3} more anomalies
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Saved Searches */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Saved Searches
                  <Badge badgeContent={savedSearches.length} color="secondary" sx={{ ml: 1 }} />
                </Typography>
                <List dense>
                  {savedSearches.slice(0, 3).map((search) => (
                    <ListItem
                      key={search.id}
                      button
                      onClick={() => handleLoadSearch(search)}
                    >
                      <ListItemIcon>
                        <History />
                      </ListItemIcon>
                      <ListItemText
                        primary={search.name}
                        secondary={`Last used: ${search.lastUsed.toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Log Results */}
        <Paper sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Search Results ({logs.length} logs)
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                startIcon={<Download />}
                onClick={() => {
                  // Export logs
                  const dataStr = JSON.stringify(logs, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `logs_${new Date().toISOString()}.json`;
                  link.click();
                }}
              >
                Export
              </Button>
              <IconButton onClick={handleSearch} disabled={loading}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
            {logs.map((log, index) => (
              <Box
                key={`${log.timestamp}-${index}`}
                sx={{
                  p: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => onLogSelect?.(log)}
              >
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Chip
                    label={log.level.toUpperCase()}
                    size="small"
                    sx={{ ...formatLogLevel(log.level), fontWeight: 'bold' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.timestamp).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {log.source}
                  </Typography>
                  {log.correlationId && (
                    <Chip
                      label={`ID: ${log.correlationId.slice(0, 8)}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {log.message}
                </Typography>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Metadata: {JSON.stringify(log.metadata)}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {logs.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No logs found. Try adjusting your search criteria.
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Query Builder Dialog */}
        <QueryBuilderDialog
          open={queryBuilderOpen}
          onClose={() => setQueryBuilderOpen(false)}
          onApply={(builtQuery) => {
            setQuery({ ...query, query: builtQuery });
            setQueryBuilderOpen(false);
          }}
        />

        {/* Save Search Dialog */}
        <SaveSearchDialog
          open={saveSearchOpen}
          onClose={() => setSaveSearchOpen(false)}
          onSave={handleSaveSearch}
        />

        {/* Pattern Analysis Dialog */}
        <PatternAnalysisDialog
          open={patternAnalysisOpen}
          patterns={patterns}
          onClose={() => setPatternAnalysisOpen(false)}
        />

        {/* Anomaly Detection Dialog */}
        <AnomalyDetectionDialog
          open={anomalyDetectionOpen}
          anomalies={anomalies}
          onClose={() => setAnomalyDetectionOpen(false)}
        />
      </Box>
    </LocalizationProvider>
  );
};

// Query Builder Dialog Component
interface QueryBuilderDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (query: string) => void;
}

const QueryBuilderDialog: React.FC<QueryBuilderDialogProps> = ({
  open,
  onClose,
  onApply,
}) => {
  const [conditions, setConditions] = useState<Array<{
    field: string;
    operator: string;
    value: string;
    connector: string;
  }>>([{ field: 'message', operator: 'contains', value: '', connector: 'AND' }]);

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: 'message', operator: 'contains', value: '', connector: 'AND' },
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<typeof conditions[0]>) => {
    setConditions(conditions.map((cond, i) => i === index ? { ...cond, ...updates } : cond));
  };

  const buildQuery = () => {
    return conditions
      .filter(cond => cond.field && cond.value)
      .map((cond, index) => {
        const query = `${cond.field}:${cond.operator === 'contains' ? `"${cond.value}"` : cond.value}`;
        return index === 0 ? query : `${cond.connector} ${query}`;
      })
      .join(' ');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Query Builder</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {conditions.map((condition, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              {index > 0 && (
                <Grid item xs={2}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={condition.connector}
                      onChange={(e) => updateCondition(index, { connector: e.target.value })}
                    >
                      <MenuItem value="AND">AND</MenuItem>
                      <MenuItem value="OR">OR</MenuItem>
                      <MenuItem value="NOT">NOT</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={index === 0 ? 3 : 2}>
                <FormControl fullWidth size="small">
                  <Select
                    value={condition.field}
                    onChange={(e) => updateCondition(index, { field: e.target.value })}
                  >
                    <MenuItem value="message">Message</MenuItem>
                    <MenuItem value="level">Level</MenuItem>
                    <MenuItem value="source">Source</MenuItem>
                    <MenuItem value="category">Category</MenuItem>
                    <MenuItem value="correlationId">Correlation ID</MenuItem>
                    <MenuItem value="userId">User ID</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={2}>
                <FormControl fullWidth size="small">
                  <Select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, { operator: e.target.value })}
                  >
                    <MenuItem value="contains">Contains</MenuItem>
                    <MenuItem value="equals">Equals</MenuItem>
                    <MenuItem value="startswith">Starts With</MenuItem>
                    <MenuItem value="endswith">Ends With</MenuItem>
                    <MenuItem value="regex">Regex</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={index === 0 ? 4 : 3}>
                <TextField
                  fullWidth
                  size="small"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  placeholder="Enter value..."
                />
              </Grid>
              <Grid item xs={1}>
                <IconButton
                  onClick={() => removeCondition(index)}
                  disabled={conditions.length === 1}
                >
                  <Clear />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          
          <Button onClick={addCondition} startIcon={<Add />}>
            Add Condition
          </Button>
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Generated Query:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {buildQuery() || 'No conditions specified'}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onApply(buildQuery())} variant="contained">
          Apply Query
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Save Search Dialog Component
interface SaveSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

const SaveSearchDialog: React.FC<SaveSearchDialogProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Save Search</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Search Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Pattern Analysis Dialog Component
interface PatternAnalysisDialogProps {
  open: boolean;
  patterns: LogPattern[];
  onClose: () => void;
}

const PatternAnalysisDialog: React.FC<PatternAnalysisDialogProps> = ({
  open,
  patterns,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Pattern Analysis</DialogTitle>
      <DialogContent>
        <List>
          {patterns.map((pattern) => (
            <Accordion key={pattern.id}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  {getSeverityIcon(pattern.severity)}
                  <Typography variant="h6">{pattern.name}</Typography>
                  <Chip
                    label={`${pattern.count} occurrences`}
                    color={getSeverityColor(pattern.severity) as any}
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" gutterBottom>
                  {pattern.description}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Pattern: <code>{pattern.pattern}</code>
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Examples:
                </Typography>
                {pattern.examples.map((example, index) => (
                  <Box key={index} sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1, mb: 1 }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {example.message}
                    </Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Anomaly Detection Dialog Component
interface AnomalyDetectionDialogProps {
  open: boolean;
  anomalies: LogAnomaly[];
  onClose: () => void;
}

const AnomalyDetectionDialog: React.FC<AnomalyDetectionDialogProps> = ({
  open,
  anomalies,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Anomaly Detection</DialogTitle>
      <DialogContent>
        <List>
          {anomalies.map((anomaly) => (
            <Accordion key={anomaly.id}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  {getSeverityIcon(anomaly.severity)}
                  <Typography variant="h6">{anomaly.description}</Typography>
                  <Chip
                    label={`${(anomaly.confidence * 100).toFixed(0)}% confidence`}
                    color={getSeverityColor(anomaly.severity) as any}
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Type:</Typography>
                    <Typography variant="body2">{anomaly.type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Detected At:</Typography>
                    <Typography variant="body2">
                      {anomaly.detectedAt.toLocaleString()}
                    </Typography>
                  </Grid>
                  {anomaly.baseline && (
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Baseline:</Typography>
                      <Typography variant="body2">{anomaly.baseline}</Typography>
                    </Grid>
                  )}
                  {anomaly.current && (
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Current:</Typography>
                      <Typography variant="body2">{anomaly.current}</Typography>
                    </Grid>
                  )}
                </Grid>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Affected Logs ({anomaly.affectedLogs.length}):
                </Typography>
                {anomaly.affectedLogs.slice(0, 5).map((log, index) => (
                  <Box key={index} sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1, mb: 1 }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      [{log.level}] {log.message}
                    </Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedLogSearch;