import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid2 as Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  History as HistoryIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api';

interface ApiRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body: string;
  timestamp: Date;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
}

interface ApiCollection {
  id: string;
  name: string;
  requests: ApiRequest[];
}

interface EnvironmentVariable {
  key: string;
  value: string;
  description: string;
}

export function ApiTesting() {
  const [selectedMethod, setSelectedMethod] = useState<string>('GET');
  const [url, setUrl] = useState<string>('');
  const [headers, setHeaders] = useState<string>('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState<string>('{}');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestHistory, setRequestHistory] = useState<ApiRequest[]>([]);
  const [collections, setCollections] = useState<ApiCollection[]>([]);
  const [environmentVars, setEnvironmentVars] = useState<EnvironmentVariable[]>([
    { key: 'BASE_URL', value: 'http://localhost:3000', description: 'API Base URL' },
    { key: 'AUTH_TOKEN', value: '', description: 'Authentication Token' },
  ]);
  const [showHistory, setShowHistory] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [showLoadTesting, setShowLoadTesting] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Load API documentation
  const { data: apiDocs } = useQuery({
    queryKey: ['api-docs'],
    queryFn: () => apiService.get('/admin/api/docs'),
  });

  const sendRequest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      
      // Replace environment variables in URL and body
      let processedUrl = url;
      let processedBody = body;
      
      environmentVars.forEach(envVar => {
        const placeholder = `{{${envVar.key}}}`;
        processedUrl = processedUrl.replace(new RegExp(placeholder, 'g'), envVar.value);
        processedBody = processedBody.replace(new RegExp(placeholder, 'g'), envVar.value);
      });

      const parsedHeaders = JSON.parse(headers);
      
      const config: any = {
        method: selectedMethod,
        url: processedUrl,
        headers: parsedHeaders,
      };

      if (['POST', 'PUT', 'PATCH'].includes(selectedMethod)) {
        config.data = JSON.parse(processedBody);
      }

      const result = await apiService.request(config);
      const duration = Date.now() - startTime;

      const apiResponse: ApiResponse = {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers,
        data: result.data,
        duration,
      };

      setResponse(apiResponse);

      // Add to history
      const newRequest: ApiRequest = {
        id: Date.now().toString(),
        name: `${selectedMethod} ${processedUrl}`,
        method: selectedMethod as any,
        url: processedUrl,
        headers: parsedHeaders,
        body: processedBody,
        timestamp: new Date(),
      };

      setRequestHistory(prev => [newRequest, ...prev.slice(0, 49)]); // Keep last 50 requests
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (request: ApiRequest) => {
    setSelectedMethod(request.method);
    setUrl(request.url);
    setHeaders(JSON.stringify(request.headers, null, 2));
    setBody(request.body);
    setShowHistory(false);
  };

  const saveToCollection = () => {
    const newRequest: ApiRequest = {
      id: Date.now().toString(),
      name: `${selectedMethod} ${url}`,
      method: selectedMethod as any,
      url,
      headers: JSON.parse(headers),
      body,
      timestamp: new Date(),
    };

    // For now, add to a default collection
    const defaultCollection = collections.find(c => c.name === 'Default') || {
      id: 'default',
      name: 'Default',
      requests: [],
    };

    defaultCollection.requests.push(newRequest);
    
    if (!collections.find(c => c.name === 'Default')) {
      setCollections([defaultCollection]);
    } else {
      setCollections(prev => prev.map(c => c.id === 'default' ? defaultCollection : c));
    }
  };

  const runLoadTest = async (concurrent: number, requests: number) => {
    setLoading(true);
    try {
      const promises = Array.from({ length: concurrent }, async () => {
        const results = [];
        for (let i = 0; i < Math.ceil(requests / concurrent); i++) {
          const startTime = Date.now();
          await apiService.request({
            method: selectedMethod,
            url,
            headers: JSON.parse(headers),
            data: ['POST', 'PUT', 'PATCH'].includes(selectedMethod) ? JSON.parse(body) : undefined,
          });
          results.push(Date.now() - startTime);
        }
        return results;
      });

      const allResults = (await Promise.all(promises)).flat();
      const avgTime = allResults.reduce((a, b) => a + b, 0) / allResults.length;
      
      setResponse({
        status: 200,
        statusText: 'Load Test Complete',
        headers: {},
        data: {
          totalRequests: allResults.length,
          averageTime: avgTime,
          minTime: Math.min(...allResults),
          maxTime: Math.max(...allResults),
          results: allResults,
        },
        duration: avgTime,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Request Builder */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Request Builder
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Method</InputLabel>
                    <Select
                      value={selectedMethod}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                      label="Method"
                    >
                      <MenuItem value="GET">GET</MenuItem>
                      <MenuItem value="POST">POST</MenuItem>
                      <MenuItem value="PUT">PUT</MenuItem>
                      <MenuItem value="DELETE">DELETE</MenuItem>
                      <MenuItem value="PATCH">PATCH</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    size="small"
                    label="URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="{{BASE_URL}}/api/endpoint"
                  />
                </Grid>
                <Grid item xs={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={sendRequest}
                    disabled={loading || !url}
                    startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
                  >
                    Send
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label="Headers" />
                <Tab label="Body" />
                <Tab label="Auth" />
              </Tabs>
              
              {tabValue === 0 && (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Headers (JSON)"
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}
              
              {tabValue === 1 && (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Request Body (JSON)"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={selectedMethod === 'GET'}
                  sx={{ mt: 2 }}
                />
              )}
              
              {tabValue === 2 && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Authorization Token"
                    value={environmentVars.find(v => v.key === 'AUTH_TOKEN')?.value || ''}
                    onChange={(e) => {
                      setEnvironmentVars(prev => prev.map(v => 
                        v.key === 'AUTH_TOKEN' ? { ...v, value: e.target.value } : v
                      ));
                    }}
                    placeholder="Bearer token or API key"
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                startIcon={<SaveIcon />}
                onClick={saveToCollection}
                disabled={!url}
              >
                Save
              </Button>
              <Button
                startIcon={<HistoryIcon />}
                onClick={() => setShowHistory(true)}
              >
                History
              </Button>
              <Button
                startIcon={<SettingsIcon />}
                onClick={() => setShowEnvironment(true)}
              >
                Environment
              </Button>
              <Button
                startIcon={<SpeedIcon />}
                onClick={() => setShowLoadTesting(true)}
              >
                Load Test
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Response Viewer */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Response
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {response && (
              <Box>
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${response.status} ${response.statusText}`}
                    color={response.status < 400 ? 'success' : 'error'}
                  />
                  <Chip label={`${response.duration}ms`} variant="outlined" />
                </Box>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Response Headers</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                      {JSON.stringify(response.headers, null, 2)}
                    </pre>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Response Body</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '400px' }}>
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* API Documentation */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              API Documentation Explorer
            </Typography>
            
            {apiDocs?.data?.endpoints?.map((endpoint: any, index: number) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={endpoint.method}
                      size="small"
                      color={endpoint.method === 'GET' ? 'primary' : 'secondary'}
                    />
                    <Typography>{endpoint.path}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {endpoint.description}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Parameters:
                      </Typography>
                      <pre style={{ fontSize: '12px' }}>
                        {JSON.stringify(endpoint.parameters || {}, null, 2)}
                      </pre>
                      
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Example Response:
                      </Typography>
                      <pre style={{ fontSize: '12px' }}>
                        {JSON.stringify(endpoint.example || {}, null, 2)}
                      </pre>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedMethod(endpoint.method);
                        setUrl(`{{BASE_URL}}${endpoint.path}`);
                        if (endpoint.exampleBody) {
                          setBody(JSON.stringify(endpoint.exampleBody, null, 2));
                        }
                      }}
                    >
                      Try It
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* History Dialog */}
      <Dialog open={showHistory} onClose={() => setShowHistory(false)} maxWidth="md" fullWidth>
        <DialogTitle>Request History</DialogTitle>
        <DialogContent>
          <List>
            {requestHistory.map((request, index) => (
              <React.Fragment key={request.id}>
                <ListItem>
                  <ListItemText
                    primary={request.name}
                    secondary={request.timestamp.toLocaleString()}
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => loadFromHistory(request)}>
                      <PlayArrowIcon />
                    </IconButton>
                    <IconButton onClick={() => {
                      setRequestHistory(prev => prev.filter(r => r.id !== request.id));
                    }}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < requestHistory.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Environment Variables Dialog */}
      <Dialog open={showEnvironment} onClose={() => setShowEnvironment(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Environment Variables</DialogTitle>
        <DialogContent>
          {environmentVars.map((envVar, index) => (
            <Box key={envVar.key} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label={envVar.key}
                value={envVar.value}
                onChange={(e) => {
                  setEnvironmentVars(prev => prev.map((v, i) => 
                    i === index ? { ...v, value: e.target.value } : v
                  ));
                }}
                helperText={envVar.description}
                sx={{ mb: 1 }}
              />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEnvironment(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Load Testing Dialog */}
      <Dialog open={showLoadTesting} onClose={() => setShowLoadTesting(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Load Testing</DialogTitle>
        <DialogContent>
          <LoadTestingForm onRunTest={runLoadTest} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoadTesting(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function LoadTestingForm({ onRunTest }: { onRunTest: (concurrent: number, requests: number) => void }) {
  const [concurrent, setConcurrent] = useState(5);
  const [requests, setRequests] = useState(100);

  return (
    <Box sx={{ pt: 2 }}>
      <TextField
        fullWidth
        type="number"
        label="Concurrent Requests"
        value={concurrent}
        onChange={(e) => setConcurrent(Number(e.target.value))}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        type="number"
        label="Total Requests"
        value={requests}
        onChange={(e) => setRequests(Number(e.target.value))}
        sx={{ mb: 2 }}
      />
      <Button
        fullWidth
        variant="contained"
        onClick={() => onRunTest(concurrent, requests)}
      >
        Run Load Test
      </Button>
    </Box>
  );
}