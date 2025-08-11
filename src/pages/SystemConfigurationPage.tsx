import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
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
  Tooltip,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Flag as FlagIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  Sync as SyncIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  History as HistoryIcon,
  Rule as RuleIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid/models';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { systemConfigurationApi } from '../services/api';
import TargetingRulesManager from '../components/system-configuration/TargetingRulesManager';
import ABTestManager from '../components/system-configuration/ABTestManager';
import FeatureFlagImpactTracker from '../components/system-configuration/FeatureFlagImpactTracker';
import SystemSettingsManager from '../components/system-configuration/SystemSettingsManager';
import EnvironmentSyncManager from '../components/system-configuration/EnvironmentSyncManager';

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
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SystemConfigurationPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [createFlagOpen, setCreateFlagOpen] = useState(false);
  const [createSettingOpen, setCreateSettingOpen] = useState(false);
  const [editConfigOpen, setEditConfigOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('production');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Advanced feature flag management states
  const [targetingRulesOpen, setTargetingRulesOpen] = useState(false);
  const [abTestOpen, setAbTestOpen] = useState(false);
  const [impactTrackerOpen, setImpactTrackerOpen] = useState(false);
  const [selectedFeatureFlagKey, setSelectedFeatureFlagKey] = useState<string>('');
  
  // Enhanced system settings management states
  const [enhancedSettingsOpen, setEnhancedSettingsOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch feature flags
  const { data: featureFlags, isLoading: flagsLoading } = useQuery({
    queryKey: ['featureFlags', selectedEnvironment],
    queryFn: () => systemConfigurationApi.getFeatureFlags(selectedEnvironment)
  });

  // Fetch system settings
  const { data: systemSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['systemSettings', selectedEnvironment],
    queryFn: () => systemConfigurationApi.getSystemSettings(undefined, selectedEnvironment)
  });

  // Fetch environments
  const { data: environments } = useQuery({
    queryKey: ['environments'],
    queryFn: () => systemConfigurationApi.getEnvironments()
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => systemConfigurationApi.getCategories()
  });

  // Create feature flag mutation
  const createFlagMutation = useMutation({
    mutationFn: systemConfigurationApi.createFeatureFlag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
      setCreateFlagOpen(false);
      setSnackbar({ open: true, message: 'Feature flag created successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to create feature flag', severity: 'error' });
    }
  });

  // Create system setting mutation
  const createSettingMutation = useMutation({
    mutationFn: systemConfigurationApi.createSystemSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      setCreateSettingOpen(false);
      setSnackbar({ open: true, message: 'System setting created successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to create system setting', severity: 'error' });
    }
  });

  // Update feature flag mutation
  const updateFlagMutation = useMutation({
    mutationFn: ({ key, environment, updates }: { key: string; environment: string; updates: any }) =>
      systemConfigurationApi.updateFeatureFlag(key, environment, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
      setSnackbar({ open: true, message: 'Feature flag updated successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to update feature flag', severity: 'error' });
    }
  });

  // Update system setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: ({ key, environment, value }: { key: string; environment: string; value: any }) =>
      systemConfigurationApi.updateSystemSetting(key, environment, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      setSnackbar({ open: true, message: 'System setting updated successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to update system setting', severity: 'error' });
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEnvironmentChange = (environment: string) => {
    setSelectedEnvironment(environment);
  };

  const handleToggleFeatureFlag = (key: string, enabled: boolean) => {
    updateFlagMutation.mutate({
      key,
      environment: selectedEnvironment,
      updates: { enabled }
    });
  };

  const handleUpdateRolloutPercentage = (key: string, rolloutPercentage: number) => {
    updateFlagMutation.mutate({
      key,
      environment: selectedEnvironment,
      updates: { rolloutPercentage }
    });
  };

  const handleUpdateSystemSetting = (key: string, value: any) => {
    updateSettingMutation.mutate({
      key,
      environment: selectedEnvironment,
      value
    });
  };

  // Feature flags columns
  const featureFlagColumns: GridColDef[] = [
    { field: 'key', headerName: 'Key', width: 200 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    {
      field: 'enabled',
      headerName: 'Enabled',
      width: 120,
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={(e) => handleToggleFeatureFlag(params.row.key, e.target.checked)}
          size="small"
        />
      )
    },
    {
      field: 'rolloutPercentage',
      headerName: 'Rollout %',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={`${params.value || 100}%`}
          color={params.value === 100 ? 'success' : 'warning'}
          size="small"
        />
      )
    },
    {
      field: 'environments',
      headerName: 'Environments',
      width: 200,
      renderCell: (params) => (
        <Box>
          {params.value?.map((env: string) => (
            <Chip key={env} label={env} size="small" sx={{ mr: 0.5 }} />
          ))}
        </Box>
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 200,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => {
            setSelectedConfig(params.row);
            setEditConfigOpen(true);
          }}
        />,
        <GridActionsCellItem
          icon={<RuleIcon />}
          label="Targeting Rules"
          onClick={() => {
            setSelectedFeatureFlagKey(params.row.key);
            setTargetingRulesOpen(true);
          }}
        />,
        <GridActionsCellItem
          icon={<AnalyticsIcon />}
          label="A/B Test"
          onClick={() => {
            setSelectedFeatureFlagKey(params.row.key);
            setAbTestOpen(true);
          }}
        />,
        <GridActionsCellItem
          icon={<AssessmentIcon />}
          label="Impact"
          onClick={() => {
            setSelectedFeatureFlagKey(params.row.key);
            setImpactTrackerOpen(true);
          }}
        />
      ]
    }
  ];

  // System settings columns
  const systemSettingColumns: GridColDef[] = [
    { field: 'key', headerName: 'Key', width: 200 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'category', headerName: 'Category', width: 150 },
    {
      field: 'value',
      headerName: 'Value',
      width: 200,
      renderCell: (params) => {
        const value = params.value;
        if (typeof value === 'boolean') {
          return <Chip label={value ? 'True' : 'False'} color={value ? 'success' : 'default'} size="small" />;
        }
        if (typeof value === 'object') {
          return <Chip label="Object" variant="outlined" size="small" />;
        }
        return String(value);
      }
    },
    { field: 'dataType', headerName: 'Type', width: 100 },
    {
      field: 'isReadOnly',
      headerName: 'Read Only',
      width: 100,
      renderCell: (params) => params.value ? <Chip label="Yes" size="small" /> : null
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => {
            setSelectedConfig(params.row);
            setEditConfigOpen(true);
          }}
          disabled={params.row.isReadOnly}
        />
      ]
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            System Configuration
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Environment</InputLabel>
              <Select
                value={selectedEnvironment}
                onChange={(e) => handleEnvironmentChange(e.target.value)}
                label="Environment"
              >
                {environments?.map((env: string) => (
                  <MenuItem key={env} value={env}>
                    {env.charAt(0).toUpperCase() + env.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {/* Export configurations */}}
            >
              Export
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => {/* Import configurations */}}
            >
              Import
            </Button>
          </Box>
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab
                label="Feature Flags"
                icon={<FlagIcon />}
                iconPosition="start"
              />
              <Tab
                label="System Settings"
                icon={<StorageIcon />}
                iconPosition="start"
              />
              <Tab
                label="Environment Sync"
                icon={<SyncIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Feature Flags</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateFlagOpen(true)}
              >
                Create Feature Flag
              </Button>
            </Box>
            
            {/* Feature Flags Quick Controls */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {featureFlags?.slice(0, 6).map((flag: any) => (
                <Grid item xs={12} sm={6} md={4} key={flag.key}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" noWrap>
                          {flag.name}
                        </Typography>
                        <Switch
                          checked={flag.enabled}
                          onChange={(e) => handleToggleFeatureFlag(flag.key, e.target.checked)}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {flag.description}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Rollout: {flag.rolloutPercentage || 100}%
                        </Typography>
                        <Slider
                          value={flag.rolloutPercentage || 100}
                          onChange={(_, value) => handleUpdateRolloutPercentage(flag.key, value as number)}
                          disabled={!flag.enabled}
                          size="small"
                          marks
                          step={10}
                          min={0}
                          max={100}
                        />
                      </Box>
                      <Box>
                        {flag.environments?.map((env: string) => (
                          <Chip
                            key={env}
                            label={env}
                            size="small"
                            color={env === selectedEnvironment ? 'primary' : 'default'}
                            sx={{ mr: 0.5 }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <DataGrid
              rows={featureFlags || []}
              columns={featureFlagColumns}
              loading={flagsLoading}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              autoHeight
              getRowId={(row) => row.key}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">System Settings</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => setEnhancedSettingsOpen(true)}
                >
                  Enhanced Management
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateSettingOpen(true)}
                >
                  Create System Setting
                </Button>
              </Box>
            </Box>

            {/* Settings by Category */}
            {categories?.map((category: string) => {
              const categorySettings = systemSettings?.filter((setting: any) => setting.category === category);
              if (!categorySettings?.length) return null;

              return (
                <Accordion key={category} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                    </Typography>
                    <Chip
                      label={categorySettings.length}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {categorySettings.map((setting: any) => (
                        <ListItem key={setting.key}>
                          <ListItemText
                            primary={setting.name}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  {setting.description}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Key: {setting.key} | Type: {setting.dataType}
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {setting.dataType === 'boolean' ? (
                                <Switch
                                  checked={setting.value}
                                  onChange={(e) => handleUpdateSystemSetting(setting.key, e.target.checked)}
                                  disabled={setting.isReadOnly}
                                  size="small"
                                />
                              ) : (
                                <Chip
                                  label={String(setting.value)}
                                  size="small"
                                  onClick={() => {
                                    if (!setting.isReadOnly) {
                                      setSelectedConfig(setting);
                                      setEditConfigOpen(true);
                                    }
                                  }}
                                />
                              )}
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedConfig(setting);
                                  setEditConfigOpen(true);
                                }}
                                disabled={setting.isReadOnly}
                              >
                                <EditIcon />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}

            <DataGrid
              rows={systemSettings || []}
              columns={systemSettingColumns}
              loading={settingsLoading}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              autoHeight
              getRowId={(row) => row.key}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <EnvironmentSyncManager
              environments={environments || []}
              onClose={() => {}}
            />
          </TabPanel>
        </Paper>
      </motion.div>

      {/* Create Feature Flag Dialog */}
      <CreateFeatureFlagDialog
        open={createFlagOpen}
        onClose={() => setCreateFlagOpen(false)}
        onSubmit={(data) => createFlagMutation.mutate(data)}
        environments={environments || []}
        loading={createFlagMutation.isPending}
      />

      {/* Create System Setting Dialog */}
      <CreateSystemSettingDialog
        open={createSettingOpen}
        onClose={() => setCreateSettingOpen(false)}
        onSubmit={(data) => createSettingMutation.mutate(data)}
        categories={categories || []}
        environments={environments || []}
        loading={createSettingMutation.isPending}
      />

      {/* Edit Configuration Dialog */}
      <EditConfigurationDialog
        open={editConfigOpen}
        onClose={() => setEditConfigOpen(false)}
        config={selectedConfig}
        environment={selectedEnvironment}
        onSubmit={(updates) => {
          if (selectedConfig?.rolloutPercentage !== undefined) {
            // Feature flag
            updateFlagMutation.mutate({
              key: selectedConfig.key,
              environment: selectedEnvironment,
              updates
            });
          } else {
            // System setting
            updateSettingMutation.mutate({
              key: selectedConfig.key,
              environment: selectedEnvironment,
              value: updates.value
            });
          }
          setEditConfigOpen(false);
        }}
        loading={updateFlagMutation.isPending || updateSettingMutation.isPending}
      />

      {/* Advanced Feature Flag Management Dialogs */}
      <Dialog
        open={targetingRulesOpen}
        onClose={() => setTargetingRulesOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <TargetingRulesManager
            featureFlagKey={selectedFeatureFlagKey}
            environment={selectedEnvironment}
            onClose={() => setTargetingRulesOpen(false)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTargetingRulesOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={abTestOpen}
        onClose={() => setAbTestOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <ABTestManager
            featureFlagKey={selectedFeatureFlagKey}
            environment={selectedEnvironment}
            onClose={() => setAbTestOpen(false)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbTestOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={impactTrackerOpen}
        onClose={() => setImpactTrackerOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <FeatureFlagImpactTracker
            featureFlagKey={selectedFeatureFlagKey}
            environment={selectedEnvironment}
            onClose={() => setImpactTrackerOpen(false)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImpactTrackerOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced System Settings Management Dialog */}
      <Dialog
        open={enhancedSettingsOpen}
        onClose={() => setEnhancedSettingsOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <SystemSettingsManager
            environment={selectedEnvironment}
            onClose={() => setEnhancedSettingsOpen(false)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnhancedSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Create Feature Flag Dialog Component
const CreateFeatureFlagDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  environments: string[];
  loading: boolean;
}> = ({ open, onClose, onSubmit, environments, loading }) => {
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    enabled: false,
    environments: [],
    rolloutPercentage: 100,
    targetUsers: [],
    conditions: {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create Feature Flag</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                required
                helperText="Unique identifier for the feature flag"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                }
                label="Enabled"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rollout Percentage"
                type="number"
                value={formData.rolloutPercentage}
                onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Environments</InputLabel>
                <Select
                  multiple
                  value={formData.environments}
                  onChange={(e) => setFormData({ ...formData, environments: e.target.value as string[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {environments.map((env) => (
                    <MenuItem key={env} value={env}>
                      {env}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Flag'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Create System Setting Dialog Component
const CreateSystemSettingDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  categories: string[];
  environments: string[];
  loading: boolean;
}> = ({ open, onClose, onSubmit, categories, environments, loading }) => {
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    value: '',
    dataType: 'string',
    category: '',
    environment: 'production',
    isReadOnly: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert value based on data type
    let processedValue = formData.value;
    switch (formData.dataType) {
      case 'number':
        processedValue = parseFloat(formData.value);
        break;
      case 'boolean':
        processedValue = formData.value === 'true';
        break;
      case 'object':
        try {
          processedValue = JSON.parse(formData.value);
        } catch {
          processedValue = {};
        }
        break;
      case 'array':
        try {
          processedValue = JSON.parse(formData.value);
        } catch {
          processedValue = [];
        }
        break;
    }

    onSubmit({ ...formData, value: processedValue });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create System Setting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Data Type</InputLabel>
                <Select
                  value={formData.dataType}
                  onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                >
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="boolean">Boolean</MenuItem>
                  <MenuItem value="object">Object</MenuItem>
                  <MenuItem value="array">Array</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  required
                >
                  {environments.map((env) => (
                    <MenuItem key={env} value={env}>
                      {env}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                multiline={formData.dataType === 'object' || formData.dataType === 'array'}
                rows={formData.dataType === 'object' || formData.dataType === 'array' ? 3 : 1}
                required
                helperText={
                  formData.dataType === 'object' || formData.dataType === 'array'
                    ? 'Enter valid JSON'
                    : formData.dataType === 'boolean'
                    ? 'Enter "true" or "false"'
                    : undefined
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isReadOnly}
                    onChange={(e) => setFormData({ ...formData, isReadOnly: e.target.checked })}
                  />
                }
                label="Read Only"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Setting'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Edit Configuration Dialog Component
const EditConfigurationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  config: any;
  environment: string;
  onSubmit: (updates: any) => void;
  loading: boolean;
}> = ({ open, onClose, config, environment, onSubmit, loading }) => {
  const [updates, setUpdates] = useState<any>({});

  useEffect(() => {
    if (config) {
      if (config.rolloutPercentage !== undefined) {
        // Feature flag
        setUpdates({
          enabled: config.enabled,
          rolloutPercentage: config.rolloutPercentage,
          targetUsers: config.targetUsers || [],
          conditions: config.conditions || {}
        });
      } else {
        // System setting
        setUpdates({
          value: config.value
        });
      }
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(updates);
  };

  if (!config) return null;

  const isFeatureFlag = config.rolloutPercentage !== undefined;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          Edit {isFeatureFlag ? 'Feature Flag' : 'System Setting'}: {config.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Environment: {environment}
            </Typography>
            
            {isFeatureFlag ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={updates.enabled || false}
                        onChange={(e) => setUpdates({ ...updates, enabled: e.target.checked })}
                      />
                    }
                    label="Enabled"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography gutterBottom>
                    Rollout Percentage: {updates.rolloutPercentage || 100}%
                  </Typography>
                  <Slider
                    value={updates.rolloutPercentage || 100}
                    onChange={(_, value) => setUpdates({ ...updates, rolloutPercentage: value })}
                    marks
                    step={10}
                    min={0}
                    max={100}
                  />
                </Grid>
              </Grid>
            ) : (
              <TextField
                fullWidth
                label="Value"
                value={typeof updates.value === 'object' ? JSON.stringify(updates.value, null, 2) : String(updates.value || '')}
                onChange={(e) => {
                  let value = e.target.value;
                  if (config.dataType === 'number') {
                    value = parseFloat(value) || 0;
                  } else if (config.dataType === 'boolean') {
                    value = value === 'true';
                  } else if (config.dataType === 'object' || config.dataType === 'array') {
                    try {
                      value = JSON.parse(value);
                    } catch {
                      // Keep as string if invalid JSON
                    }
                  }
                  setUpdates({ ...updates, value });
                }}
                multiline={config.dataType === 'object' || config.dataType === 'array'}
                rows={config.dataType === 'object' || config.dataType === 'array' ? 4 : 1}
                disabled={config.isReadOnly}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading || config.isReadOnly}>
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SystemConfigurationPage;