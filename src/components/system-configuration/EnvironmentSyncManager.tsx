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
  ListItemSecondaryAction,
  Divider,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Checkbox,
  FormGroup
} from '@mui/material';
import {
  Sync as SyncIcon,
  Compare as CompareIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemConfigurationApi } from '../../services/systemConfigurationApi';

interface EnvironmentSyncManagerProps {
  environments: string[];
  onClose?: () => void;
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
      id={`sync-tabpanel-${index}`}
      aria-labelledby={`sync-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EnvironmentSyncManager: React.FC<EnvironmentSyncManagerProps> = ({
  environments,
  onClose
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [compareOpen, setCompareOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [driftOpen, setDriftOpen] = useState(false);
  
  // Comparison state
  const [sourceEnv, setSourceEnv] = useState('');
  const [targetEnv, setTargetEnv] = useState('');
  const [configType, setConfigType] = useState<'feature-flags' | 'system-settings' | 'all'>('all');
  
  // Sync state
  const [selectedDifferences, setSelectedDifferences] = useState<string[]>([]);
  const [conflictResolution, setConflictResolution] = useState<'source' | 'target' | 'manual'>('source');
  const [createBackup, setCreateBackup] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  
  // Active sync tracking
  const [activeSyncId, setActiveSyncId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch environment comparison
  const { data: comparisonData, isLoading: comparisonLoading } = useQuery({
    queryKey: ['environmentComparison', sourceEnv, targetEnv, configType],
    queryFn: () => {
      if (!sourceEnv || !targetEnv) return null;
      return systemConfigurationApi.compareEnvironments(sourceEnv, targetEnv, configType);
    },
    enabled: !!sourceEnv && !!targetEnv && compareOpen
  });

  // Fetch backups
  const { data: backups } = useQuery({
    queryKey: ['configBackups'],
    queryFn: () => systemConfigurationApi.getBackups()
  });

  // Fetch sync schedules
  const { data: syncSchedules } = useQuery({
    queryKey: ['syncSchedules'],
    queryFn: () => systemConfigurationApi.getSyncSchedules()
  });

  // Fetch drift alerts
  const { data: driftAlerts } = useQuery({
    queryKey: ['driftAlerts'],
    queryFn: () => systemConfigurationApi.getDriftAlerts()
  });

  // Fetch active sync status
  const { data: syncStatus } = useQuery({
    queryKey: ['syncStatus', activeSyncId],
    queryFn: () => {
      if (!activeSyncId) return null;
      return systemConfigurationApi.getSyncStatus(activeSyncId);
    },
    enabled: !!activeSyncId,
    refetchInterval: 2000 // Poll every 2 seconds
  });

  // Sync environments mutation
  const syncMutation = useMutation({
    mutationFn: (options: {
      sourceEnvironment: string;
      targetEnvironment: string;
      configType: 'feature-flags' | 'system-settings' | 'all';
      selectedKeys?: string[];
      conflictResolution: 'source' | 'target' | 'manual';
      createBackup: boolean;
      dryRun: boolean;
    }) => systemConfigurationApi.syncEnvironments(options.sourceEnvironment, options.targetEnvironment, options),
    onSuccess: (data) => {
      setActiveSyncId(data.syncId);
      if (!dryRun) {
        queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
        queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      }
    }
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: (options: {
      environment: string;
      name?: string;
      description?: string;
      configType?: 'feature-flags' | 'system-settings' | 'all';
    }) => systemConfigurationApi.createBackup(options.environment, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configBackups'] });
      setBackupOpen(false);
    }
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: (options: {
      backupId: string;
      targetEnvironment: string;
      configType?: 'feature-flags' | 'system-settings' | 'all';
      overwriteExisting?: boolean;
    }) => systemConfigurationApi.restoreBackup(options.backupId, options.targetEnvironment, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      setRestoreOpen(false);
    }
  });

  // Create sync schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: (schedule: any) => systemConfigurationApi.createSyncSchedule(schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncSchedules'] });
      setScheduleOpen(false);
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCompare = () => {
    if (sourceEnv && targetEnv) {
      setCompareOpen(true);
    }
  };

  const handleSync = () => {
    if (!sourceEnv || !targetEnv) return;
    
    syncMutation.mutate({
      sourceEnvironment: sourceEnv,
      targetEnvironment: targetEnv,
      configType,
      selectedKeys: selectedDifferences.length > 0 ? selectedDifferences : undefined,
      conflictResolution,
      createBackup,
      dryRun
    });
  };

  const getConflictColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'in-progress': return 'info';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Environment Synchronization
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<BackupIcon />}
              onClick={() => setBackupOpen(true)}
            >
              Create Backup
            </Button>
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={() => setRestoreOpen(true)}
            >
              Restore
            </Button>
            <Button
              variant="outlined"
              startIcon={<ScheduleIcon />}
              onClick={() => setScheduleOpen(true)}
            >
              Schedule Sync
            </Button>
          </Box>
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Environment Sync" />
              <Tab label="Backups" />
              <Tab label="Scheduled Syncs" />
              <Tab label="Drift Detection" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Compare Environments
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Source Environment</InputLabel>
                          <Select
                            value={sourceEnv}
                            onChange={(e) => setSourceEnv(e.target.value)}
                            label="Source Environment"
                          >
                            {environments.map((env) => (
                              <MenuItem key={env} value={env}>
                                {env.charAt(0).toUpperCase() + env.slice(1)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Target Environment</InputLabel>
                          <Select
                            value={targetEnv}
                            onChange={(e) => setTargetEnv(e.target.value)}
                            label="Target Environment"
                          >
                            {environments.filter(env => env !== sourceEnv).map((env) => (
                              <MenuItem key={env} value={env}>
                                {env.charAt(0).toUpperCase() + env.slice(1)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Configuration Type</InputLabel>
                          <Select
                            value={configType}
                            onChange={(e) => setConfigType(e.target.value as any)}
                            label="Configuration Type"
                          >
                            <MenuItem value="all">All Configurations</MenuItem>
                            <MenuItem value="feature-flags">Feature Flags Only</MenuItem>
                            <MenuItem value="system-settings">System Settings Only</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          startIcon={<CompareIcon />}
                          onClick={handleCompare}
                          disabled={!sourceEnv || !targetEnv || comparisonLoading}
                          fullWidth
                        >
                          {comparisonLoading ? 'Comparing...' : 'Compare Environments'}
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Sync Options
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={createBackup}
                            onChange={(e) => setCreateBackup(e.target.checked)}
                          />
                        }
                        label="Create backup before sync"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={dryRun}
                            onChange={(e) => setDryRun(e.target.checked)}
                          />
                        }
                        label="Dry run (preview only)"
                      />
                    </FormGroup>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Conflict Resolution</InputLabel>
                      <Select
                        value={conflictResolution}
                        onChange={(e) => setConflictResolution(e.target.value as any)}
                        label="Conflict Resolution"
                      >
                        <MenuItem value="source">Use Source Values</MenuItem>
                        <MenuItem value="target">Keep Target Values</MenuItem>
                        <MenuItem value="manual">Manual Resolution</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      startIcon={<SyncIcon />}
                      onClick={handleSync}
                      disabled={!sourceEnv || !targetEnv || syncMutation.isPending}
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      {syncMutation.isPending ? 'Syncing...' : dryRun ? 'Preview Sync' : 'Start Sync'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sync Progress */}
              {syncStatus && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Sync Progress
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          {syncStatus.currentStep}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={syncStatus.progress}
                          sx={{ mt: 1 }}
                        />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {syncStatus.progress}% complete
                        </Typography>
                      </Box>
                      <Chip
                        label={syncStatus.status}
                        color={getStatusColor(syncStatus.status)}
                        size="small"
                      />
                      {syncStatus.status === 'in-progress' && (
                        <Button
                          size="small"
                          startIcon={<StopIcon />}
                          onClick={() => {
                            if (activeSyncId) {
                              systemConfigurationApi.cancelSync(activeSyncId);
                            }
                          }}
                          sx={{ ml: 1 }}
                        >
                          Cancel
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Configuration Backups
            </Typography>
            <Grid container spacing={2}>
              {backups?.map((backup) => (
                <Grid item xs={12} sm={6} md={4} key={backup.backupId}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" noWrap>
                        {backup.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {backup.environment} • {backup.configCount} configs
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(backup.createdAt).toLocaleString()}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<RestoreIcon />}
                          onClick={() => {
                            // Open restore dialog with this backup
                            setRestoreOpen(true);
                          }}
                        >
                          Restore
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => {
                            systemConfigurationApi.downloadBackup(backup.backupId)
                              .then(blob => {
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${backup.name}.json`;
                                a.click();
                              });
                          }}
                        >
                          Download
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Scheduled Synchronizations
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Source → Target</TableCell>
                    <TableCell>Schedule</TableCell>
                    <TableCell>Next Run</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {syncSchedules?.map((schedule) => (
                    <TableRow key={schedule.scheduleId}>
                      <TableCell>{schedule.name}</TableCell>
                      <TableCell>
                        {schedule.sourceEnvironment} → {schedule.targetEnvironment}
                      </TableCell>
                      <TableCell>{schedule.cronExpression}</TableCell>
                      <TableCell>{new Date(schedule.nextRun).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={schedule.enabled ? 'Enabled' : 'Disabled'}
                          color={schedule.enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            systemConfigurationApi.triggerSyncSchedule(schedule.scheduleId);
                          }}
                        >
                          <PlayIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Configuration Drift Detection
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Monitor configuration drift between environments to ensure consistency.
            </Alert>
            <Grid container spacing={2}>
              {driftAlerts?.map((alert) => (
                <Grid item xs={12} md={6} key={alert.alertId}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{alert.name}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Baseline: {alert.baselineEnvironment}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Monitoring: {alert.monitoredEnvironments.join(', ')}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={alert.enabled ? 'Active' : 'Inactive'}
                          color={alert.enabled ? 'success' : 'default'}
                          size="small"
                        />
                        <Typography variant="caption">
                          Next: {new Date(alert.nextRun).toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>
        </Paper>

        {/* Environment Comparison Dialog */}
        <Dialog open={compareOpen} onClose={() => setCompareOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            Environment Comparison: {sourceEnv} vs {targetEnv}
          </DialogTitle>
          <DialogContent>
            {comparisonData && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="h4">{comparisonData.summary.totalDifferences}</Typography>
                        <Typography variant="body2" color="textSecondary">Total Differences</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="h4" color="success.main">{comparisonData.summary.added}</Typography>
                        <Typography variant="body2" color="textSecondary">Added</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="h4" color="warning.main">{comparisonData.summary.modified}</Typography>
                        <Typography variant="body2" color="textSecondary">Modified</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="h4" color="error.main">{comparisonData.summary.conflicts}</Typography>
                        <Typography variant="body2" color="textSecondary">Conflicts</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={selectedDifferences.length > 0 && selectedDifferences.length < comparisonData.differences.length}
                            checked={selectedDifferences.length === comparisonData.differences.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDifferences(comparisonData.differences.map(d => d.key));
                              } else {
                                setSelectedDifferences([]);
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>Key</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Source Value</TableCell>
                        <TableCell>Target Value</TableCell>
                        <TableCell>Conflict Level</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {comparisonData.differences.map((diff) => (
                        <TableRow key={diff.key}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedDifferences.includes(diff.key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDifferences([...selectedDifferences, diff.key]);
                                } else {
                                  setSelectedDifferences(selectedDifferences.filter(k => k !== diff.key));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>{diff.key}</TableCell>
                          <TableCell>
                            <Chip label={diff.type} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip label={diff.status} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" component="pre">
                              {JSON.stringify(diff.sourceValue, null, 2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" component="pre">
                              {JSON.stringify(diff.targetValue, null, 2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={diff.conflictLevel}
                              color={getConflictColor(diff.conflictLevel)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompareOpen(false)}>Close</Button>
            <Button
              variant="contained"
              startIcon={<SyncIcon />}
              onClick={() => {
                setCompareOpen(false);
                setSyncOpen(true);
              }}
              disabled={!comparisonData || comparisonData.differences.length === 0}
            >
              Proceed to Sync
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Backup Dialog */}
        <CreateBackupDialog
          open={backupOpen}
          onClose={() => setBackupOpen(false)}
          environments={environments}
          onSubmit={(data) => createBackupMutation.mutate(data)}
          loading={createBackupMutation.isPending}
        />

        {/* Restore Backup Dialog */}
        <RestoreBackupDialog
          open={restoreOpen}
          onClose={() => setRestoreOpen(false)}
          backups={backups || []}
          environments={environments}
          onSubmit={(data) => restoreBackupMutation.mutate(data)}
          loading={restoreBackupMutation.isPending}
        />

        {/* Schedule Sync Dialog */}
        <ScheduleSyncDialog
          open={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          environments={environments}
          onSubmit={(data) => createScheduleMutation.mutate(data)}
          loading={createScheduleMutation.isPending}
        />
      </Box>
    </LocalizationProvider>
  );
};

// Create Backup Dialog Component
const CreateBackupDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  environments: string[];
  onSubmit: (data: any) => void;
  loading: boolean;
}> = ({ open, onClose, environments, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    environment: '',
    name: '',
    description: '',
    configType: 'all' as 'feature-flags' | 'system-settings' | 'all',
    includeHistory: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create Configuration Backup</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  label="Environment"
                  required
                >
                  {environments.map((env) => (
                    <MenuItem key={env} value={env}>
                      {env.charAt(0).toUpperCase() + env.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Backup Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`Backup-${new Date().toISOString().split('T')[0]}`}
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
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Configuration Type</InputLabel>
                <Select
                  value={formData.configType}
                  onChange={(e) => setFormData({ ...formData, configType: e.target.value as any })}
                  label="Configuration Type"
                >
                  <MenuItem value="all">All Configurations</MenuItem>
                  <MenuItem value="feature-flags">Feature Flags Only</MenuItem>
                  <MenuItem value="system-settings">System Settings Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.includeHistory}
                    onChange={(e) => setFormData({ ...formData, includeHistory: e.target.checked })}
                  />
                }
                label="Include Change History"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading || !formData.environment}>
            {loading ? 'Creating...' : 'Create Backup'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Restore Backup Dialog Component
const RestoreBackupDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  backups: any[];
  environments: string[];
  onSubmit: (data: any) => void;
  loading: boolean;
}> = ({ open, onClose, backups, environments, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    backupId: '',
    targetEnvironment: '',
    configType: 'all' as 'feature-flags' | 'system-settings' | 'all',
    overwriteExisting: false,
    createBackupBeforeRestore: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Restore Configuration Backup</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Backup</InputLabel>
                <Select
                  value={formData.backupId}
                  onChange={(e) => setFormData({ ...formData, backupId: e.target.value })}
                  label="Backup"
                  required
                >
                  {backups.map((backup) => (
                    <MenuItem key={backup.backupId} value={backup.backupId}>
                      {backup.name} ({backup.environment} - {new Date(backup.createdAt).toLocaleDateString()})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Target Environment</InputLabel>
                <Select
                  value={formData.targetEnvironment}
                  onChange={(e) => setFormData({ ...formData, targetEnvironment: e.target.value })}
                  label="Target Environment"
                  required
                >
                  {environments.map((env) => (
                    <MenuItem key={env} value={env}>
                      {env.charAt(0).toUpperCase() + env.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Configuration Type</InputLabel>
                <Select
                  value={formData.configType}
                  onChange={(e) => setFormData({ ...formData, configType: e.target.value as any })}
                  label="Configuration Type"
                >
                  <MenuItem value="all">All Configurations</MenuItem>
                  <MenuItem value="feature-flags">Feature Flags Only</MenuItem>
                  <MenuItem value="system-settings">System Settings Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.overwriteExisting}
                    onChange={(e) => setFormData({ ...formData, overwriteExisting: e.target.checked })}
                  />
                }
                label="Overwrite Existing Configurations"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.createBackupBeforeRestore}
                    onChange={(e) => setFormData({ ...formData, createBackupBeforeRestore: e.target.checked })}
                  />
                }
                label="Create Backup Before Restore"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.backupId || !formData.targetEnvironment}
          >
            {loading ? 'Restoring...' : 'Restore Backup'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Schedule Sync Dialog Component
const ScheduleSyncDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  environments: string[];
  onSubmit: (data: any) => void;
  loading: boolean;
}> = ({ open, onClose, environments, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceEnvironment: '',
    targetEnvironment: '',
    configType: 'all' as 'feature-flags' | 'system-settings' | 'all',
    cronExpression: '0 2 * * *', // Daily at 2 AM
    enabled: true,
    options: {
      conflictResolution: 'source' as 'source' | 'target' | 'skip',
      createBackup: true,
      notifyOnFailure: true,
      notificationEmails: ['']
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Schedule Environment Sync</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Schedule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cron Expression"
                value={formData.cronExpression}
                onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                helperText="e.g., '0 2 * * *' for daily at 2 AM"
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Source Environment</InputLabel>
                <Select
                  value={formData.sourceEnvironment}
                  onChange={(e) => setFormData({ ...formData, sourceEnvironment: e.target.value })}
                  label="Source Environment"
                  required
                >
                  {environments.map((env) => (
                    <MenuItem key={env} value={env}>
                      {env.charAt(0).toUpperCase() + env.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Target Environment</InputLabel>
                <Select
                  value={formData.targetEnvironment}
                  onChange={(e) => setFormData({ ...formData, targetEnvironment: e.target.value })}
                  label="Target Environment"
                  required
                >
                  {environments.filter(env => env !== formData.sourceEnvironment).map((env) => (
                    <MenuItem key={env} value={env}>
                      {env.charAt(0).toUpperCase() + env.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Configuration Type</InputLabel>
                <Select
                  value={formData.configType}
                  onChange={(e) => setFormData({ ...formData, configType: e.target.value as any })}
                  label="Configuration Type"
                >
                  <MenuItem value="all">All Configurations</MenuItem>
                  <MenuItem value="feature-flags">Feature Flags Only</MenuItem>
                  <MenuItem value="system-settings">System Settings Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Conflict Resolution</InputLabel>
                <Select
                  value={formData.options.conflictResolution}
                  onChange={(e) => setFormData({
                    ...formData,
                    options: { ...formData.options, conflictResolution: e.target.value as any }
                  })}
                  label="Conflict Resolution"
                >
                  <MenuItem value="source">Use Source Values</MenuItem>
                  <MenuItem value="target">Keep Target Values</MenuItem>
                  <MenuItem value="skip">Skip Conflicts</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    />
                  }
                  label="Enable Schedule"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.options.createBackup}
                      onChange={(e) => setFormData({
                        ...formData,
                        options: { ...formData.options, createBackup: e.target.checked }
                      })}
                    />
                  }
                  label="Create Backup Before Sync"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.options.notifyOnFailure}
                      onChange={(e) => setFormData({
                        ...formData,
                        options: { ...formData.options, notifyOnFailure: e.target.checked }
                      })}
                    />
                  }
                  label="Notify on Failure"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name || !formData.sourceEnvironment || !formData.targetEnvironment}
          >
            {loading ? 'Creating...' : 'Create Schedule'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EnvironmentSyncManager;