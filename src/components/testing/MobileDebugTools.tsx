import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  BugReport,
  Memory,
  Speed,
  NetworkCheck,
  Storage,
  Visibility,
  Code,
  Timeline,
  Error,
  Warning,
  Info,
  CheckCircle,
  ExpandMore,
  Refresh,
  Download,
  Clear,
  PlayArrow,
  Stop,
  Settings,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'error';
  threshold: number;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  source: string;
  details?: any;
}

interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  size: number;
  timestamp: Date;
}

export function MobileDebugTools() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedTab, setSelectedTab] = useState('performance');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([
    { name: 'FPS', value: 58, unit: 'fps', status: 'good', threshold: 55 },
    { name: 'Memory Usage', value: 145, unit: 'MB', status: 'warning', threshold: 200 },
    { name: 'CPU Usage', value: 23, unit: '%', status: 'good', threshold: 70 },
    { name: 'Battery Drain', value: 8, unit: '%/hr', status: 'good', threshold: 15 },
    { name: 'Network Latency', value: 45, unit: 'ms', status: 'good', threshold: 100 },
    { name: 'Bundle Size', value: 2.3, unit: 'MB', status: 'good', threshold: 5 },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      // Update performance metrics
      setPerformanceMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 5,
        status: metric.value > metric.threshold ? 'error' : 
                metric.value > metric.threshold * 0.8 ? 'warning' : 'good'
      })));

      // Add random log entries
      if (Math.random() < 0.3) {
        const levels: LogEntry['level'][] = ['info', 'warning', 'error', 'debug'];
        const sources = ['GameEngine', 'NetworkService', 'UIRenderer', 'AudioManager'];
        const messages = [
          'Player action processed successfully',
          'Network connection unstable',
          'Memory usage threshold exceeded',
          'Animation frame dropped',
          'WebSocket connection established',
          'Voice chat initialized',
        ];

        const newLog: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          level: levels[Math.floor(Math.random() * levels.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          source: sources[Math.floor(Math.random() * sources.length)],
        };

        setLogs(prev => [newLog, ...prev.slice(0, 49)]);
      }

      // Add random network requests
      if (Math.random() < 0.2) {
        const methods = ['GET', 'POST', 'PUT', 'DELETE'];
        const endpoints = ['/api/auth/login', '/api/games/join', '/api/players/stats', '/api/rooms/create'];
        const statuses = [200, 201, 400, 404, 500];

        const newRequest: NetworkRequest = {
          id: Date.now().toString(),
          method: methods[Math.floor(Math.random() * methods.length)],
          url: endpoints[Math.floor(Math.random() * endpoints.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          duration: Math.floor(Math.random() * 1000) + 50,
          size: Math.floor(Math.random() * 10000) + 500,
          timestamp: new Date(),
        };

        setNetworkRequests(prev => [newRequest, ...prev.slice(0, 19)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'info': return <Info color="info" />;
      case 'debug': return <Code color="action" />;
      default: return <Info />;
    }
  };

  const clearLogs = () => setLogs([]);
  const clearNetworkRequests = () => setNetworkRequests([]);

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mobile-debug-logs-${Date.now()}.json`;
    link.click();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Mobile Debug Tools
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={isMonitoring}
                onChange={(e) => setIsMonitoring(e.target.checked)}
              />
            }
            label="Real-time Monitoring"
          />
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportLogs}
            disabled={logs.length === 0}
          >
            Export Logs
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Performance Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                {performanceMetrics.map((metric) => (
                  <Grid item xs={6} sm={4} md={2} key={metric.name}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color={`${getStatusColor(metric.status)}.main`}>
                        {metric.value.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {metric.name}
                      </Typography>
                      <Typography variant="caption">
                        {metric.unit}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(metric.value / metric.threshold) * 100}
                        color={getStatusColor(metric.status) as any}
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Debug Panels */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 500 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Console Logs ({logs.length})
                </Typography>
                <Box>
                  <IconButton onClick={clearLogs} size="small">
                    <Clear />
                  </IconButton>
                  <IconButton onClick={() => setIsMonitoring(!isMonitoring)} size="small">
                    {isMonitoring ? <Stop /> : <PlayArrow />}
                  </IconButton>
                </Box>
              </Box>
              
              <Box sx={{ height: 400, overflow: 'auto' }}>
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          p: 1,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        {getLogIcon(log.level)}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {log.timestamp.toLocaleTimeString()}
                            </Typography>
                            <Chip label={log.source} size="small" variant="outlined" />
                            <Chip 
                              label={log.level.toUpperCase()} 
                              size="small" 
                              color={getStatusColor(log.level === 'debug' ? 'good' : log.level) as any}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {log.message}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {logs.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No logs available. Enable monitoring to see real-time logs.
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Network Monitor */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 500 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Network Requests ({networkRequests.length})
                </Typography>
                <Box>
                  <IconButton onClick={clearNetworkRequests} size="small">
                    <Clear />
                  </IconButton>
                  <IconButton size="small">
                    <Settings />
                  </IconButton>
                </Box>
              </Box>
              
              <TableContainer sx={{ height: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Method</TableCell>
                      <TableCell>URL</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Size</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {networkRequests.map((request) => (
                      <TableRow key={request.id} hover>
                        <TableCell>
                          <Chip 
                            label={request.method} 
                            size="small"
                            color={request.method === 'GET' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 150 }}>
                          <Typography variant="body2" noWrap>
                            {request.url}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={request.status} 
                            size="small"
                            color={request.status < 300 ? 'success' : request.status < 500 ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.duration}ms
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(request.size / 1024).toFixed(1)}KB
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {networkRequests.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No network requests captured yet.
                    </Typography>
                  </Box>
                )}
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Device Inspector */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Inspector
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>Device Information</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        <ListItem>
                          <ListItemText primary="User Agent" secondary="Mobile Safari 16.0" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Screen Resolution" secondary="390x844" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Pixel Ratio" secondary="3.0" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Orientation" secondary="Portrait" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Touch Support" secondary="Enabled" />
                        </ListItem>
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>Storage & Cache</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        <ListItem>
                          <ListItemText primary="Local Storage" secondary="2.3MB / 10MB" />
                          <LinearProgress variant="determinate" value={23} sx={{ width: 60 }} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Session Storage" secondary="0.8MB / 5MB" />
                          <LinearProgress variant="determinate" value={16} sx={{ width: 60 }} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="IndexedDB" secondary="15.2MB / 50MB" />
                          <LinearProgress variant="determinate" value={30} sx={{ width: 60 }} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Cache API" secondary="8.7MB / 20MB" />
                          <LinearProgress variant="determinate" value={43} sx={{ width: 60 }} />
                        </ListItem>
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>API Availability</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary="Geolocation API" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary="Camera API" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary="Device Motion" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Error color="error" />
                          </ListItemIcon>
                          <ListItemText primary="Push Notifications" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary="WebRTC" />
                        </ListItem>
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}