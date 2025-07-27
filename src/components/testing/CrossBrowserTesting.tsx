import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  PhoneAndroid,
  PhoneIphone,
  Laptop,
  Tablet,
  Computer,
  PlayArrow,
  Stop,
  Refresh,
  Screenshot,
  BugReport,
  CheckCircle,
  Error,
  Warning,
  Visibility,
  Code,
  Compare,
  Download,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface BrowserConfig {
  id: string;
  name: string;
  version: string;
  userAgent: string;
  icon: React.ElementType;
  platform: string;
  features: {
    webrtc: boolean;
    webgl: boolean;
    serviceWorker: boolean;
    pushNotifications: boolean;
    geolocation: boolean;
    camera: boolean;
  };
}

interface TestResult {
  browserId: string;
  testName: string;
  status: 'passed' | 'failed' | 'warning';
  duration: number;
  details: string;
  screenshot?: string;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: string[];
  enabled: boolean;
}

const BROWSER_CONFIGS: BrowserConfig[] = [
  {
    id: 'chrome-mobile',
    name: 'Chrome Mobile',
    version: '120.0',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    icon: PhoneAndroid,
    platform: 'Android',
    features: {
      webrtc: true,
      webgl: true,
      serviceWorker: true,
      pushNotifications: true,
      geolocation: true,
      camera: true,
    }
  },
  {
    id: 'safari-mobile',
    name: 'Safari Mobile',
    version: '17.0',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    icon: PhoneIphone,
    platform: 'iOS',
    features: {
      webrtc: true,
      webgl: true,
      serviceWorker: true,
      pushNotifications: false,
      geolocation: true,
      camera: true,
    }
  },
  {
    id: 'firefox-mobile',
    name: 'Firefox Mobile',
    version: '121.0',
    userAgent: 'Mozilla/5.0 (Mobile; rv:121.0) Gecko/121.0 Firefox/121.0',
    icon: PhoneAndroid,
    platform: 'Android',
    features: {
      webrtc: true,
      webgl: true,
      serviceWorker: true,
      pushNotifications: true,
      geolocation: true,
      camera: true,
    }
  },
  {
    id: 'edge-mobile',
    name: 'Edge Mobile',
    version: '120.0',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 EdgA/120.0.2210.61',
    icon: PhoneAndroid,
    platform: 'Android',
    features: {
      webrtc: true,
      webgl: true,
      serviceWorker: true,
      pushNotifications: true,
      geolocation: true,
      camera: true,
    }
  },
  {
    id: 'chrome-tablet',
    name: 'Chrome Tablet',
    version: '120.0',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    icon: Tablet,
    platform: 'Android',
    features: {
      webrtc: true,
      webgl: true,
      serviceWorker: true,
      pushNotifications: true,
      geolocation: true,
      camera: true,
    }
  },
  {
    id: 'safari-tablet',
    name: 'Safari iPad',
    version: '17.0',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    icon: Tablet,
    platform: 'iOS',
    features: {
      webrtc: true,
      webgl: true,
      serviceWorker: true,
      pushNotifications: false,
      geolocation: true,
      camera: true,
    }
  }
];

const TEST_SUITES: TestSuite[] = [
  {
    id: 'ui-rendering',
    name: 'UI Rendering Tests',
    description: 'Test component rendering and layout across browsers',
    tests: [
      'Player card rendering',
      'Voting interface layout',
      'Chat component display',
      'Game phase indicators',
      'Navigation elements'
    ],
    enabled: true
  },
  {
    id: 'functionality',
    name: 'Functionality Tests',
    description: 'Test core game functionality and user interactions',
    tests: [
      'User authentication flow',
      'Room creation and joining',
      'Game state synchronization',
      'Voting mechanism',
      'Chat functionality'
    ],
    enabled: true
  },
  {
    id: 'performance',
    name: 'Performance Tests',
    description: 'Test app performance and resource usage',
    tests: [
      'Initial load time',
      'Memory usage monitoring',
      'Animation smoothness',
      'Network request efficiency',
      'Battery usage impact'
    ],
    enabled: true
  },
  {
    id: 'compatibility',
    name: 'Feature Compatibility',
    description: 'Test browser-specific feature availability',
    tests: [
      'WebRTC voice chat',
      'Camera access',
      'Geolocation services',
      'Push notifications',
      'Service worker caching'
    ],
    enabled: true
  }
];

export function CrossBrowserTesting() {
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>(['chrome-mobile', 'safari-mobile']);
  const [selectedTestSuites, setSelectedTestSuites] = useState<string[]>(['ui-rendering', 'functionality']);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [customUrl, setCustomUrl] = useState('http://localhost:3000');

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setTestResults([]);

    const totalTests = selectedBrowsers.length * selectedTestSuites.reduce((acc, suiteId) => {
      const suite = TEST_SUITES.find(s => s.id === suiteId);
      return acc + (suite?.tests.length || 0);
    }, 0);

    let completedTests = 0;

    // Simulate running tests
    for (const browserId of selectedBrowsers) {
      for (const suiteId of selectedTestSuites) {
        const suite = TEST_SUITES.find(s => s.id === suiteId);
        if (!suite) continue;

        for (const testName of suite.tests) {
          // Simulate test execution
          await new Promise(resolve => setTimeout(resolve, 500));

          const result: TestResult = {
            browserId,
            testName,
            status: Math.random() > 0.8 ? 'failed' : Math.random() > 0.9 ? 'warning' : 'passed',
            duration: Math.floor(Math.random() * 2000) + 500,
            details: `Test completed on ${BROWSER_CONFIGS.find(b => b.id === browserId)?.name}`,
          };

          setTestResults(prev => [...prev, result]);
          completedTests++;
          setProgress((completedTests / totalTests) * 100);
        }
      }
    }

    setIsRunning(false);
  };

  const stopTests = () => {
    setIsRunning(false);
    setProgress(0);
  };

  const clearResults = () => {
    setTestResults([]);
    setProgress(0);
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cross-browser-test-results-${Date.now()}.json`;
    link.click();
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle color="success" />;
      case 'failed': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      default: return null;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  const getTestSummary = () => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const warnings = testResults.filter(r => r.status === 'warning').length;

    return { total, passed, failed, warnings };
  };

  const summary = getTestSummary();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Cross-Browser Mobile Testing
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Test mobile app compatibility across different browsers and devices
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Configuration
              </Typography>

              <TextField
                fullWidth
                label="Test URL"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" gutterBottom>
                Select Browsers
              </Typography>
              <Box sx={{ mb: 2 }}>
                {BROWSER_CONFIGS.map((browser) => (
                  <FormControlLabel
                    key={browser.id}
                    control={
                      <Switch
                        checked={selectedBrowsers.includes(browser.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBrowsers(prev => [...prev, browser.id]);
                          } else {
                            setSelectedBrowsers(prev => prev.filter(id => id !== browser.id));
                          }
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <browser.icon fontSize="small" />
                        {browser.name}
                        <Chip label={browser.platform} size="small" />
                      </Box>
                    }
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Test Suites
              </Typography>
              <Box sx={{ mb: 2 }}>
                {TEST_SUITES.map((suite) => (
                  <FormControlLabel
                    key={suite.id}
                    control={
                      <Switch
                        checked={selectedTestSuites.includes(suite.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTestSuites(prev => [...prev, suite.id]);
                          } else {
                            setSelectedTestSuites(prev => prev.filter(id => id !== suite.id));
                          }
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">{suite.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {suite.tests.length} tests
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                <Button
                  variant="contained"
                  onClick={runTests}
                  disabled={isRunning || selectedBrowsers.length === 0 || selectedTestSuites.length === 0}
                  startIcon={<PlayArrow />}
                  fullWidth
                >
                  Run Tests
                </Button>
                <Button
                  variant="outlined"
                  onClick={stopTests}
                  disabled={!isRunning}
                  startIcon={<Stop />}
                  fullWidth
                >
                  Stop Tests
                </Button>
                <Button
                  variant="text"
                  onClick={clearResults}
                  disabled={isRunning || testResults.length === 0}
                  fullWidth
                >
                  Clear Results
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Test Results
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setShowComparison(true)}
                    disabled={testResults.length === 0}
                    startIcon={<Compare />}
                  >
                    Compare
                  </Button>
                  <Button
                    size="small"
                    onClick={exportResults}
                    disabled={testResults.length === 0}
                    startIcon={<Download />}
                  >
                    Export
                  </Button>
                </Box>
              </Box>

              {isRunning && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Running tests... {Math.round(progress)}%
                  </Typography>
                  <LinearProgress variant="determinate" value={progress} />
                </Box>
              )}

              {testResults.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Paper sx={{ p: 1, textAlign: 'center' }}>
                        <Typography variant="h6">{summary.total}</Typography>
                        <Typography variant="caption">Total</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'success.light' }}>
                        <Typography variant="h6">{summary.passed}</Typography>
                        <Typography variant="caption">Passed</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'error.light' }}>
                        <Typography variant="h6">{summary.failed}</Typography>
                        <Typography variant="caption">Failed</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.light' }}>
                        <Typography variant="h6">{summary.warnings}</Typography>
                        <Typography variant="caption">Warnings</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}

              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Browser</TableCell>
                      <TableCell>Test</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {testResults.map((result, index) => {
                        const browser = BROWSER_CONFIGS.find(b => b.id === result.browserId);
                        return (
                          <motion.tr
                            key={`${result.browserId}-${result.testName}-${index}`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            component={TableRow}
                            hover
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {browser && <browser.icon fontSize="small" />}
                                <Typography variant="body2">
                                  {browser?.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {result.testName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getStatusIcon(result.status)}
                                <Chip
                                  label={result.status.toUpperCase()}
                                  size="small"
                                  color={getStatusColor(result.status) as any}
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {result.duration}ms
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View Details">
                                <IconButton size="small">
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Take Screenshot">
                                <IconButton size="small">
                                  <Screenshot />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>

                {testResults.length === 0 && !isRunning && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No test results yet. Configure and run tests to see results here.
                    </Typography>
                  </Box>
                )}
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Browser Feature Matrix */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Browser Feature Compatibility Matrix
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Browser</TableCell>
                      <TableCell>WebRTC</TableCell>
                      <TableCell>WebGL</TableCell>
                      <TableCell>Service Worker</TableCell>
                      <TableCell>Push Notifications</TableCell>
                      <TableCell>Geolocation</TableCell>
                      <TableCell>Camera</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {BROWSER_CONFIGS.map((browser) => (
                      <TableRow key={browser.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <browser.icon fontSize="small" />
                            <Box>
                              <Typography variant="body2">{browser.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {browser.version} • {browser.platform}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {browser.features.webrtc ? 
                            <CheckCircle color="success" fontSize="small" /> : 
                            <Error color="error" fontSize="small" />
                          }
                        </TableCell>
                        <TableCell>
                          {browser.features.webgl ? 
                            <CheckCircle color="success" fontSize="small" /> : 
                            <Error color="error" fontSize="small" />
                          }
                        </TableCell>
                        <TableCell>
                          {browser.features.serviceWorker ? 
                            <CheckCircle color="success" fontSize="small" /> : 
                            <Error color="error" fontSize="small" />
                          }
                        </TableCell>
                        <TableCell>
                          {browser.features.pushNotifications ? 
                            <CheckCircle color="success" fontSize="small" /> : 
                            <Error color="error" fontSize="small" />
                          }
                        </TableCell>
                        <TableCell>
                          {browser.features.geolocation ? 
                            <CheckCircle color="success" fontSize="small" /> : 
                            <Error color="error" fontSize="small" />
                          }
                        </TableCell>
                        <TableCell>
                          {browser.features.camera ? 
                            <CheckCircle color="success" fontSize="small" /> : 
                            <Error color="error" fontSize="small" />
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Comparison Dialog */}
      <Dialog
        open={showComparison}
        onClose={() => setShowComparison(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Cross-Browser Test Comparison</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Compare test results across different browsers to identify compatibility issues
          </Typography>
          
          {/* This would contain detailed comparison charts and analysis */}
          <Alert severity="info">
            Detailed comparison view would show side-by-side results, performance metrics, 
            and compatibility analysis across selected browsers.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowComparison(false)}>Close</Button>
          <Button variant="contained">Export Comparison</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}