import React, { useState } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  AutoFixHigh as AutoFixHighIcon,
  Code as CodeIcon,
  PlayArrow as PlayArrowIcon,
  GetApp as GetAppIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testingService } from '../../services/testingService';
import { ApiDocumentation, ApiEndpoint, TestSuite, ApiTest } from '../../types/testing';

export function ApiDocumentationIntegration() {
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [targetSuiteId, setTargetSuiteId] = useState('');
  const [showEndpointDetails, setShowEndpointDetails] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<{ valid: boolean; errors: string[] } | null>(null);

  const queryClient = useQueryClient();

  const { data: apiDocs, isLoading: docsLoading, error: docsError } = useQuery({
    queryKey: ['api-documentation'],
    queryFn: testingService.getApiDocumentation,
  });

  const { data: testSuites = [] } = useQuery({
    queryKey: ['test-suites'],
    queryFn: testingService.getTestSuites,
  });

  const validateDocsMutation = useMutation({
    mutationFn: testingService.validateApiDocumentation,
    onSuccess: (result) => {
      setValidationResults(result);
    },
  });

  const generateTestsMutation = useMutation({
    mutationFn: ({ endpoints, suiteId }: { endpoints: string[]; suiteId: string }) =>
      testingService.generateTestsFromDocumentation(endpoints, suiteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites'] });
      setShowGenerateDialog(false);
      setSelectedEndpoints([]);
      setTargetSuiteId('');
    },
  });

  const handleEndpointSelection = (endpointId: string, selected: boolean) => {
    if (selected) {
      setSelectedEndpoints([...selectedEndpoints, endpointId]);
    } else {
      setSelectedEndpoints(selectedEndpoints.filter(id => id !== endpointId));
    }
  };

  const handleSelectAll = () => {
    if (!apiDocs) return;
    
    if (selectedEndpoints.length === apiDocs.endpoints.length) {
      setSelectedEndpoints([]);
    } else {
      setSelectedEndpoints(apiDocs.endpoints.map(endpoint => `${endpoint.method}:${endpoint.path}`));
    }
  };

  const handleGenerateTests = () => {
    if (selectedEndpoints.length > 0 && targetSuiteId) {
      generateTestsMutation.mutate({
        endpoints: selectedEndpoints,
        suiteId: targetSuiteId,
      });
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'primary';
      case 'POST': return 'success';
      case 'PUT': return 'warning';
      case 'DELETE': return 'error';
      case 'PATCH': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (endpoint: ApiEndpoint) => {
    // Simple validation - in a real app, you'd have more sophisticated validation
    if (!endpoint.summary || !endpoint.description) {
      return <WarningIcon color="warning" />;
    }
    if (endpoint.responses && Object.keys(endpoint.responses).length > 0) {
      return <CheckCircleIcon color="success" />;
    }
    return <ErrorIcon color="error" />;
  };

  const renderParameterTable = (parameters: any[]) => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Parameters
      </Typography>
      {parameters.length > 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          {parameters.map((param, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                borderBottom: index < parameters.length - 1 ? 1 : 0,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {param.name}
                </Typography>
                <Chip
                  size="small"
                  label={param.in}
                  variant="outlined"
                />
                {param.required && (
                  <Chip
                    size="small"
                    label="required"
                    color="error"
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {param.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Type: {param.schema?.type || 'unknown'}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No parameters
        </Typography>
      )}
    </Box>
  );

  const renderResponseTable = (responses: Record<string, any>) => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Responses
      </Typography>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        {Object.entries(responses).map(([status, response], index) => (
          <Box
            key={status}
            sx={{
              p: 2,
              borderBottom: index < Object.entries(responses).length - 1 ? 1 : 0,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                size="small"
                label={status}
                color={status.startsWith('2') ? 'success' : status.startsWith('4') ? 'warning' : 'error'}
              />
              <Typography variant="body2">
                {response.description}
              </Typography>
            </Box>
            {response.content && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Content Types: {Object.keys(response.content).join(', ')}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );

  if (docsLoading) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading API documentation...</Typography>
      </Box>
    );
  }

  if (docsError || !apiDocs) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load API documentation. Please ensure the API documentation endpoint is available.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">API Documentation Integration</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => validateDocsMutation.mutate()}
            disabled={validateDocsMutation.isPending}
          >
            Validate Docs
          </Button>
          <Button
            variant="contained"
            startIcon={<AutoFixHighIcon />}
            onClick={() => setShowGenerateDialog(true)}
            disabled={selectedEndpoints.length === 0}
          >
            Generate Tests ({selectedEndpoints.length})
          </Button>
        </Box>
      </Box>

      {/* API Documentation Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {apiDocs.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {apiDocs.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip size="small" label={`v${apiDocs.version}`} />
                <Chip size="small" label={`${apiDocs.endpoints.length} endpoints`} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Base URL
              </Typography>
              <Typography variant="body2" fontFamily="monospace">
                {apiDocs.baseUrl}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Validation Status
              </Typography>
              {validationResults ? (
                <Box>
                  <Chip
                    icon={validationResults.valid ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={validationResults.valid ? 'Valid' : 'Invalid'}
                    color={validationResults.valid ? 'success' : 'error'}
                  />
                  {!validationResults.valid && validationResults.errors.length > 0 && (
                    <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                      {validationResults.errors.length} errors found
                    </Typography>
                  )}
                </Box>
              ) : (
                <Button
                  size="small"
                  onClick={() => validateDocsMutation.mutate()}
                  disabled={validateDocsMutation.isPending}
                >
                  Run Validation
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Validation Errors */}
      {validationResults && !validationResults.valid && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Documentation Validation Errors:
          </Typography>
          <List dense>
            {validationResults.errors.map((error, index) => (
              <ListItem key={index}>
                <ListItemText primary={error} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Endpoint Selection */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">API Endpoints</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedEndpoints.length === apiDocs.endpoints.length}
                indeterminate={selectedEndpoints.length > 0 && selectedEndpoints.length < apiDocs.endpoints.length}
                onChange={handleSelectAll}
              />
            }
            label="Select All"
          />
        </Box>

        <List>
          <AnimatePresence>
            {apiDocs.endpoints.map((endpoint, index) => {
              const endpointId = `${endpoint.method}:${endpoint.path}`;
              const isSelected = selectedEndpoints.includes(endpointId);
              
              return (
                <motion.div
                  key={endpointId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <ListItem
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: isSelected ? 'action.selected' : 'background.paper',
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => handleEndpointSelection(endpointId, e.target.checked)}
                        />
                      }
                      label=""
                      sx={{ mr: 1 }}
                    />
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          size="small"
                          label={endpoint.method}
                          color={getMethodColor(endpoint.method) as any}
                        />
                        <Typography variant="body1" fontFamily="monospace">
                          {endpoint.path}
                        </Typography>
                        {getStatusIcon(endpoint)}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        {endpoint.summary || endpoint.description}
                      </Typography>
                      
                      {endpoint.tags.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                          {endpoint.tags.map((tag) => (
                            <Chip key={tag} size="small" label={tag} variant="outlined" />
                          ))}
                        </Box>
                      )}
                    </Box>

                    <ListItemSecondaryAction>
                      <Tooltip title="View Details">
                        <IconButton
                          onClick={() => setShowEndpointDetails(
                            showEndpointDetails === endpointId ? null : endpointId
                          )}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>

                  {/* Endpoint Details */}
                  {showEndpointDetails === endpointId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card sx={{ ml: 4, mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {endpoint.method} {endpoint.path}
                          </Typography>
                          
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            {endpoint.description}
                          </Typography>

                          {endpoint.parameters && endpoint.parameters.length > 0 && 
                            renderParameterTable(endpoint.parameters)
                          }

                          {endpoint.requestBody && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Request Body
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Required: {endpoint.requestBody.required ? 'Yes' : 'No'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Content Types: {Object.keys(endpoint.requestBody.content || {}).join(', ')}
                              </Typography>
                            </Box>
                          )}

                          {endpoint.responses && renderResponseTable(endpoint.responses)}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </List>

        {apiDocs.endpoints.length === 0 && (
          <Alert severity="info">
            No API endpoints found in the documentation.
          </Alert>
        )}
      </Paper>

      {/* Generate Tests Dialog */}
      <Dialog open={showGenerateDialog} onClose={() => setShowGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Tests from API Documentation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Generate automated tests for {selectedEndpoints.length} selected endpoints.
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Target Test Suite</InputLabel>
            <Select
              value={targetSuiteId}
              onChange={(e) => setTargetSuiteId(e.target.value)}
              label="Target Test Suite"
            >
              {testSuites.map((suite) => (
                <MenuItem key={suite.id} value={suite.id}>
                  {suite.name} ({suite.environment})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            Tests will be generated with basic assertions for status codes and response structure.
            You can customize the generated tests after creation.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleGenerateTests} 
            variant="contained"
            disabled={!targetSuiteId || generateTestsMutation.isPending}
          >
            Generate Tests
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}