import React, { useState } from 'react';
import {
  Box,
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
  Switch,
  FormControlLabel,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers/DatePicker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemConfigurationApi } from '../../services/systemConfigurationApi';
import type { ABTest, ABTestVariant } from '../../types/systemConfiguration';

interface ABTestManagerProps {
  featureFlagKey: string;
  environment: string;
  onClose?: () => void;
}

const ABTestManager: React.FC<ABTestManagerProps> = ({
  featureFlagKey,
  environment,
  onClose
}) => {
  const [createTestOpen, setCreateTestOpen] = useState(false);
  const [editTestOpen, setEditTestOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch A/B tests
  const { data: abTests, isLoading } = useQuery({
    queryKey: ['abTests', featureFlagKey, environment],
    queryFn: () => systemConfigurationApi.getABTests(featureFlagKey, environment)
  });

  // Fetch A/B test results
  const { data: testResults } = useQuery({
    queryKey: ['abTestResults', featureFlagKey, selectedTestId, environment],
    queryFn: () => {
      if (!selectedTestId) return null;
      return systemConfigurationApi.getABTestResults(featureFlagKey, selectedTestId, environment);
    },
    enabled: !!selectedTestId
  });

  // Create A/B test mutation
  const createTestMutation = useMutation({
    mutationFn: (test: Omit<ABTest, 'id'>) =>
      systemConfigurationApi.createABTest(featureFlagKey, environment, test),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abTests', featureFlagKey, environment] });
      setCreateTestOpen(false);
    }
  });

  // Update A/B test mutation
  const updateTestMutation = useMutation({
    mutationFn: ({ testId, updates }: { testId: string; updates: Partial<ABTest> }) =>
      systemConfigurationApi.updateABTest(featureFlagKey, testId, environment, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abTests', featureFlagKey, environment] });
      setEditTestOpen(false);
    }
  });

  // Start A/B test mutation
  const startTestMutation = useMutation({
    mutationFn: (testId: string) =>
      systemConfigurationApi.startABTest(featureFlagKey, testId, environment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abTests', featureFlagKey, environment] });
    }
  });

  // Pause A/B test mutation
  const pauseTestMutation = useMutation({
    mutationFn: (testId: string) =>
      systemConfigurationApi.pauseABTest(featureFlagKey, testId, environment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abTests', featureFlagKey, environment] });
    }
  });

  // Complete A/B test mutation
  const completeTestMutation = useMutation({
    mutationFn: ({ testId, winningVariantId }: { testId: string; winningVariantId?: string }) =>
      systemConfigurationApi.completeABTest(featureFlagKey, testId, environment, winningVariantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abTests', featureFlagKey, environment] });
    }
  });

  const getStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'draft': return 'default';
      case 'running': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const handleViewResults = (testId: string) => {
    setSelectedTestId(testId);
    setResultsOpen(true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnalyticsIcon />
            A/B Tests for {featureFlagKey}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateTestOpen(true)}
          >
            Create A/B Test
          </Button>
        </Box>

        {abTests?.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No A/B tests configured. Create tests to compare different feature flag configurations.
          </Alert>
        )}

        <Grid container spacing={2}>
          {abTests?.map((test) => (
            <Grid item xs={12} md={6} lg={4} key={test.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" noWrap>
                      {test.name}
                    </Typography>
                    <Chip
                      label={test.status}
                      color={getStatusColor(test.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {test.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Traffic Allocation: {test.trafficAllocation}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={test.trafficAllocation}
                      sx={{ mb: 1 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Variants ({test.variants.length})
                    </Typography>
                    {test.variants.map((variant) => (
                      <Chip
                        key={variant.id}
                        label={`${variant.name} (${variant.rolloutPercentage}%)`}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Primary Metric
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {test.metrics.primaryMetric}
                    </Typography>
                  </Box>

                  {test.startDate && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="textSecondary">
                        Started: {new Date(test.startDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {test.status === 'draft' && (
                      <Button
                        size="small"
                        startIcon={<PlayIcon />}
                        onClick={() => startTestMutation.mutate(test.id)}
                        disabled={startTestMutation.isPending}
                      >
                        Start
                      </Button>
                    )}
                    
                    {test.status === 'running' && (
                      <>
                        <Button
                          size="small"
                          startIcon={<PauseIcon />}
                          onClick={() => pauseTestMutation.mutate(test.id)}
                          disabled={pauseTestMutation.isPending}
                        >
                          Pause
                        </Button>
                        <Button
                          size="small"
                          startIcon={<StopIcon />}
                          onClick={() => completeTestMutation.mutate({ testId: test.id })}
                          disabled={completeTestMutation.isPending}
                        >
                          Complete
                        </Button>
                      </>
                    )}

                    {test.status === 'paused' && (
                      <Button
                        size="small"
                        startIcon={<PlayIcon />}
                        onClick={() => startTestMutation.mutate(test.id)}
                        disabled={startTestMutation.isPending}
                      >
                        Resume
                      </Button>
                    )}

                    <Button
                      size="small"
                      startIcon={<AssessmentIcon />}
                      onClick={() => handleViewResults(test.id)}
                    >
                      Results
                    </Button>

                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setSelectedTest(test);
                        setEditTestOpen(true);
                      }}
                      disabled={test.status === 'running'}
                    >
                      Edit
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Create A/B Test Dialog */}
        <CreateABTestDialog
          open={createTestOpen}
          onClose={() => setCreateTestOpen(false)}
          onSubmit={(test) => createTestMutation.mutate(test)}
          loading={createTestMutation.isPending}
        />

        {/* Edit A/B Test Dialog */}
        <EditABTestDialog
          open={editTestOpen}
          onClose={() => setEditTestOpen(false)}
          test={selectedTest}
          onSubmit={(updates) => {
            if (selectedTest) {
              updateTestMutation.mutate({ testId: selectedTest.id, updates });
            }
          }}
          loading={updateTestMutation.isPending}
        />

        {/* A/B Test Results Dialog */}
        <ABTestResultsDialog
          open={resultsOpen}
          onClose={() => {
            setResultsOpen(false);
            setSelectedTestId(null);
          }}
          testId={selectedTestId}
          results={testResults}
          onCompleteTest={(winningVariantId) => {
            if (selectedTestId) {
              completeTestMutation.mutate({ testId: selectedTestId, winningVariantId });
              setResultsOpen(false);
              setSelectedTestId(null);
            }
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

// Create A/B Test Dialog Component
const CreateABTestDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (test: Omit<ABTest, 'id'>) => void;
  loading: boolean;
}> = ({ open, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    featureFlagKey: '',
    variants: [
      { id: 'control', name: 'Control', key: 'control', rolloutPercentage: 50 },
      { id: 'treatment', name: 'Treatment', key: 'treatment', rolloutPercentage: 50 }
    ] as ABTestVariant[],
    trafficAllocation: 100,
    startDate: null as Date | null,
    endDate: null as Date | null,
    status: 'draft' as const,
    metrics: {
      conversionGoals: [''],
      primaryMetric: '',
      minimumDetectableEffect: 5,
      statisticalPower: 80
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addVariant = () => {
    const newVariant: ABTestVariant = {
      id: `variant_${Date.now()}`,
      name: `Variant ${formData.variants.length + 1}`,
      key: `variant_${formData.variants.length + 1}`,
      rolloutPercentage: 0
    };
    setFormData({
      ...formData,
      variants: [...formData.variants, newVariant]
    });
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length > 2) {
      setFormData({
        ...formData,
        variants: formData.variants.filter((_, i) => i !== index)
      });
    }
  };

  const updateVariant = (index: number, field: keyof ABTestVariant, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create A/B Test</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Test Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Traffic Allocation (%)"
                type="number"
                value={formData.trafficAllocation}
                onChange={(e) => setFormData({ ...formData, trafficAllocation: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 100 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Variants
              </Typography>
              {formData.variants.map((variant, index) => (
                <Card key={variant.id} sx={{ mb: 2, p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Variant Name"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Key"
                        value={variant.key}
                        onChange={(e) => updateVariant(index, 'key', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Rollout %"
                        type="number"
                        value={variant.rolloutPercentage}
                        onChange={(e) => updateVariant(index, 'rolloutPercentage', parseInt(e.target.value))}
                        inputProps={{ min: 0, max: 100 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button
                        color="error"
                        onClick={() => removeVariant(index)}
                        disabled={formData.variants.length <= 2}
                      >
                        Remove
                      </Button>
                    </Grid>
                  </Grid>
                </Card>
              ))}
              <Button onClick={addVariant} startIcon={<AddIcon />}>
                Add Variant
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Primary Metric"
                value={formData.metrics.primaryMetric}
                onChange={(e) => setFormData({
                  ...formData,
                  metrics: { ...formData.metrics, primaryMetric: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Detectable Effect (%)"
                type="number"
                value={formData.metrics.minimumDetectableEffect}
                onChange={(e) => setFormData({
                  ...formData,
                  metrics: { ...formData.metrics, minimumDetectableEffect: parseFloat(e.target.value) }
                })}
                inputProps={{ min: 0.1, step: 0.1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <MUIDatePicker
                label="Start Date (Optional)"
                value={formData.startDate}
                onChange={(date) => setFormData({ ...formData, startDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MUIDatePicker
                label="End Date (Optional)"
                value={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Test'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Edit A/B Test Dialog Component
const EditABTestDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  test: ABTest | null;
  onSubmit: (updates: Partial<ABTest>) => void;
  loading: boolean;
}> = ({ open, onClose, test, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trafficAllocation: 100,
    endDate: null as Date | null,
    metrics: {
      conversionGoals: [''],
      primaryMetric: '',
      minimumDetectableEffect: 5,
      statisticalPower: 80
    }
  });

  React.useEffect(() => {
    if (test) {
      setFormData({
        name: test.name,
        description: test.description,
        trafficAllocation: test.trafficAllocation,
        endDate: test.endDate ? new Date(test.endDate) : null,
        metrics: test.metrics
      });
    }
  }, [test]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit A/B Test</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Test Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Traffic Allocation (%)"
                type="number"
                value={formData.trafficAllocation}
                onChange={(e) => setFormData({ ...formData, trafficAllocation: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 100 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Primary Metric"
                value={formData.metrics.primaryMetric}
                onChange={(e) => setFormData({
                  ...formData,
                  metrics: { ...formData.metrics, primaryMetric: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MUIDatePicker
                label="End Date (Optional)"
                value={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Updating...' : 'Update Test'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// A/B Test Results Dialog Component
const ABTestResultsDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  testId: string | null;
  results: any;
  onCompleteTest: (winningVariantId?: string) => void;
}> = ({ open, onClose, testId, results, onCompleteTest }) => {
  const [selectedWinner, setSelectedWinner] = useState<string>('');

  if (!results) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>A/B Test Results</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography>Loading results...</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>A/B Test Results</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity={results.summary.statisticalSignificance ? 'success' : 'warning'}>
              {results.summary.statisticalSignificance
                ? 'Results are statistically significant'
                : 'Results are not yet statistically significant'}
            </Alert>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4">{results.summary.totalUsers}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Users</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4">{results.summary.totalConversions}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Conversions</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {results.summary.winningVariant || 'No clear winner yet'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Winning Variant</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Variant Performance
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Variant</TableCell>
                    <TableCell align="right">Users</TableCell>
                    <TableCell align="right">Conversions</TableCell>
                    <TableCell align="right">Conversion Rate</TableCell>
                    <TableCell align="right">Confidence</TableCell>
                    <TableCell align="right">Significance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.variants.map((variant: any) => (
                    <TableRow key={variant.variantId}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {variant.name}
                          {results.summary.winningVariant === variant.name && (
                            <Chip label="Winner" color="success" size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{variant.users.toLocaleString()}</TableCell>
                      <TableCell align="right">{variant.conversions.toLocaleString()}</TableCell>
                      <TableCell align="right">{(variant.conversionRate * 100).toFixed(2)}%</TableCell>
                      <TableCell align="right">{(variant.confidence * 100).toFixed(1)}%</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={variant.significance > 0.05 ? 'Not Significant' : 'Significant'}
                          color={variant.significance > 0.05 ? 'default' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {results.summary.statisticalSignificance && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Complete Test
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Winning Variant</InputLabel>
                <Select
                  value={selectedWinner}
                  onChange={(e) => setSelectedWinner(e.target.value)}
                  label="Select Winning Variant"
                >
                  {results.variants.map((variant: any) => (
                    <MenuItem key={variant.variantId} value={variant.variantId}>
                      {variant.name} ({(variant.conversionRate * 100).toFixed(2)}% conversion)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={() => onCompleteTest(selectedWinner)}
                disabled={!selectedWinner}
              >
                Complete Test with Winner
              </Button>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ABTestManager;