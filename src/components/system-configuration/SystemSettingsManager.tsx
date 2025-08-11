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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Restore as RestoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Description as TemplateIcon,
  VerifiedUser as ValidateIcon,
  Link as LinkIcon,
  Upload as UploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemConfigurationApi } from '../../services/systemConfigurationApi';
import type { SystemSetting, SettingTemplate, SettingHistory, ValidationRule } from '../../types/systemConfiguration';

interface SystemSettingsManagerProps {
  environment: string;
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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SystemSettingsManager: React.FC<SystemSettingsManagerProps> = ({
  environment,
  onClose
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [dependenciesOpen, setDependenciesOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [bulkOperationsOpen, setBulkOperationsOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Fetch system settings
  const { data: systemSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['systemSettings', environment],
    queryFn: () => systemConfigurationApi.getSystemSettings(undefined, environment)
  });

  // Fetch setting templates
  const { data: settingTemplates } = useQuery({
    queryKey: ['settingTemplates'],
    queryFn: () => systemConfigurationApi.getSettingTemplates()
  });

  // Fetch setting history
  const { data: settingHistory } = useQuery({
    queryKey: ['settingHistory', selectedSetting?.key, environment],
    queryFn: () => {
      if (!selectedSetting) return null;
      return systemConfigurationApi.getSystemSettingHistory(selectedSetting.key, environment, 50);
    },
    enabled: !!selectedSetting && historyOpen
  });

  // Fetch setting dependencies
  const { data: settingDependencies } = useQuery({
    queryKey: ['settingDependencies', selectedSetting?.key, environment],
    queryFn: () => {
      if (!selectedSetting) return null;
      return systemConfigurationApi.getSettingDependencies(selectedSetting.key, environment);
    },
    enabled: !!selectedSetting && dependenciesOpen
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: ({ key, version, reason }: { key: string; version: number; reason?: string }) =>
      systemConfigurationApi.rollbackSystemSetting(key, environment, version, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      queryClient.invalidateQueries({ queryKey: ['settingHistory'] });
      setRollbackOpen(false);
      setSelectedVersion(null);
    }
  });

  // Validation mutation
  const validateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      systemConfigurationApi.validateSystemSetting(key, value, environment)
  });

  // Bulk operations mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (updates: Array<{ key: string; environment: string; value: any; reason?: string }>) =>
      systemConfigurationApi.bulkUpdateSystemSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      setBulkOperationsOpen(false);
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewHistory = (setting: SystemSetting) => {
    setSelectedSetting(setting);
    setHistoryOpen(true);
  };

  const handleViewDependencies = (setting: SystemSetting) => {
    setSelectedSetting(setting);
    setDependenciesOpen(true);
  };

  const handleRollback = (setting: SystemSetting) => {
    setSelectedSetting(setting);
    setRollbackOpen(true);
  };

  const handleValidateSetting = (setting: SystemSetting, value: any) => {
    validateMutation.mutate({ key: setting.key, value });
  };

  const getValidationIcon = (setting: SystemSetting) => {
    if (!setting.validationRules || setting.validationRules.length === 0) {
      return null;
    }
    return <ValidateIcon color="info" fontSize="small" />;
  };

  const getDependencyIcon = (setting: SystemSetting) => {
    if (!setting.dependencies || setting.dependencies.length === 0) {
      return null;
    }
    return <LinkIcon color="warning" fontSize="small" />;
  };

  // Group settings by category
  const settingsByCategory = systemSettings?.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>) || {};

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Enhanced System Settings Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<TemplateIcon />}
            onClick={() => setTemplatesOpen(true)}
          >
            Templates
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setBulkOperationsOpen(true)}
          >
            Bulk Operations
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              systemConfigurationApi.exportSystemSettings(environment)
                .then(blob => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `system-settings-${environment}.json`;
                  a.click();
                });
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Settings by Category" />
            <Tab label="Validation Rules" />
            <Tab label="Dependencies" />
            <Tab label="Change History" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {Object.entries(settingsByCategory).map(([category, settings]) => (
            <Accordion key={category} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                </Typography>
                <Chip
                  label={settings.length}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {settings.map((setting) => (
                    <ListItem key={setting.key}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {setting.name}
                            {getValidationIcon(setting)}
                            {getDependencyIcon(setting)}
                            {setting.isReadOnly && (
                              <Chip label="Read Only" size="small" color="default" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {setting.description}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Key: {setting.key} | Type: {setting.dataType}
                              {setting.version && ` | Version: ${setting.version}`}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={String(setting.value)}
                            size="small"
                            onClick={() => {
                              if (!setting.isReadOnly) {
                                setSelectedSetting(setting);
                                // Open edit dialog
                              }
                            }}
                          />
                          <Tooltip title="View History">
                            <IconButton
                              size="small"
                              onClick={() => handleViewHistory(setting)}
                            >
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Dependencies">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDependencies(setting)}
                            >
                              <LinkIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rollback">
                            <IconButton
                              size="small"
                              onClick={() => handleRollback(setting)}
                              disabled={setting.isReadOnly}
                            >
                              <RestoreIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Settings with Validation Rules
          </Typography>
          {systemSettings?.filter(s => s.validationRules && s.validationRules.length > 0).map((setting) => (
            <Card key={setting.key} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">{setting.name}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {setting.description}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Validation Rules:
                </Typography>
                <List dense>
                  {setting.validationRules?.map((rule, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${rule.type}: ${rule.value || 'N/A'}`}
                        secondary={rule.message}
                      />
                    </ListItem>
                  ))}
                </List>
                <Button
                  size="small"
                  startIcon={<ValidateIcon />}
                  onClick={() => handleValidateSetting(setting, setting.value)}
                >
                  Validate Current Value
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Settings with Dependencies
          </Typography>
          {systemSettings?.filter(s => s.dependencies && s.dependencies.length > 0).map((setting) => (
            <Card key={setting.key} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">{setting.name}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {setting.description}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Dependencies:
                </Typography>
                <List dense>
                  {setting.dependencies?.map((dep, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`Depends on: ${dep.dependsOn}`}
                        secondary={`${dep.condition.operator} ${dep.condition.value} → ${dep.action}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          ))}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Recent Changes
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Select a specific setting to view its detailed change history.
          </Alert>
        </TabPanel>
      </Paper>

      {/* Setting History Dialog */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Setting History: {selectedSetting?.name}
        </DialogTitle>
        <DialogContent>
          {settingHistory && settingHistory.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>Changed At</TableCell>
                    <TableCell>Changed By</TableCell>
                    <TableCell>Old Value</TableCell>
                    <TableCell>New Value</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settingHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.version}</TableCell>
                      <TableCell>{new Date(entry.changedAt).toLocaleString()}</TableCell>
                      <TableCell>{entry.changedBy}</TableCell>
                      <TableCell>
                        <Chip label={String(entry.oldValue)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={String(entry.newValue)} size="small" color="primary" />
                      </TableCell>
                      <TableCell>{entry.reason || 'N/A'}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<RestoreIcon />}
                          onClick={() => {
                            setSelectedVersion(entry.version);
                            setHistoryOpen(false);
                            setRollbackOpen(true);
                          }}
                        >
                          Rollback
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No history available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Dependencies Dialog */}
      <Dialog open={dependenciesOpen} onClose={() => setDependenciesOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Dependencies: {selectedSetting?.name}
        </DialogTitle>
        <DialogContent>
          {settingDependencies && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Depends On
                </Typography>
                {settingDependencies.dependsOn.length > 0 ? (
                  <List>
                    {settingDependencies.dependsOn.map((dep) => (
                      <ListItem key={dep.key}>
                        <ListItemText
                          primary={dep.name}
                          secondary={`${dep.key}: ${dep.value}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="textSecondary">No dependencies</Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Dependents
                </Typography>
                {settingDependencies.dependents.length > 0 ? (
                  <List>
                    {settingDependencies.dependents.map((dep) => (
                      <ListItem key={dep.key}>
                        <ListItemText
                          primary={dep.name}
                          secondary={`${dep.key}: ${dep.value}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="textSecondary">No dependents</Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDependenciesOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Rollback Dialog */}
      <Dialog open={rollbackOpen} onClose={() => setRollbackOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rollback Setting</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Rolling back will revert the setting to a previous version. This action will be logged.
          </Alert>
          <TextField
            fullWidth
            label="Rollback Reason"
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          {selectedVersion && (
            <Typography variant="body2">
              Rolling back to version {selectedVersion}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRollbackOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedSetting && selectedVersion) {
                rollbackMutation.mutate({
                  key: selectedSetting.key,
                  version: selectedVersion,
                  reason: 'Manual rollback'
                });
              }
            }}
            color="warning"
            variant="contained"
            disabled={!selectedVersion || rollbackMutation.isPending}
          >
            {rollbackMutation.isPending ? 'Rolling back...' : 'Rollback'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Templates Dialog */}
      <SettingTemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        templates={settingTemplates || []}
        environment={environment}
      />

      {/* Bulk Operations Dialog */}
      <BulkOperationsDialog
        open={bulkOperationsOpen}
        onClose={() => setBulkOperationsOpen(false)}
        settings={systemSettings || []}
        environment={environment}
        onBulkUpdate={(updates) => bulkUpdateMutation.mutate(updates)}
        loading={bulkUpdateMutation.isPending}
      />

      {/* Validation Results */}
      {validateMutation.data && (
        <Dialog open={!!validateMutation.data} onClose={() => validateMutation.reset()}>
          <DialogTitle>Validation Results</DialogTitle>
          <DialogContent>
            {validateMutation.data.isValid ? (
              <Alert severity="success">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon />
                  Validation passed
                </Box>
              </Alert>
            ) : (
              <Alert severity="error">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon />
                  Validation failed
                </Box>
                <List>
                  {validateMutation.data.errors.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={error.rule}
                        secondary={error.message}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => validateMutation.reset()}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

// Setting Templates Dialog Component
const SettingTemplatesDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  templates: SettingTemplate[];
  environment: string;
}> = ({ open, onClose, templates, environment }) => {
  const queryClient = useQueryClient();

  const applyTemplateMutation = useMutation({
    mutationFn: ({ templateId, overrides }: { templateId: string; overrides?: Record<string, any> }) =>
      systemConfigurationApi.applySettingTemplate(templateId, environment, overrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      onClose();
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Setting Templates</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{template.name}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    Settings ({template.settings.length}):
                  </Typography>
                  <List dense>
                    {template.settings.slice(0, 3).map((setting, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={setting.name}
                          secondary={`${setting.key}: ${setting.value}`}
                        />
                      </ListItem>
                    ))}
                    {template.settings.length > 3 && (
                      <ListItem>
                        <ListItemText secondary={`... and ${template.settings.length - 3} more`} />
                      </ListItem>
                    )}
                  </List>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => applyTemplateMutation.mutate({ templateId: template.id })}
                    disabled={applyTemplateMutation.isPending}
                  >
                    Apply Template
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Bulk Operations Dialog Component
const BulkOperationsDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  settings: SystemSetting[];
  environment: string;
  onBulkUpdate: (updates: Array<{ key: string; environment: string; value: any; reason?: string }>) => void;
  loading: boolean;
}> = ({ open, onClose, settings, environment, onBulkUpdate, loading }) => {
  const [selectedSettings, setSelectedSettings] = useState<string[]>([]);
  const [bulkValue, setBulkValue] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    const updates = selectedSettings.map(key => ({
      key,
      environment,
      value: bulkValue,
      reason
    }));
    onBulkUpdate(updates);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Operations</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Select Settings
            </Typography>
            <List>
              {settings.filter(s => !s.isReadOnly).map((setting) => (
                <ListItem key={setting.key}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedSettings.includes(setting.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSettings([...selectedSettings, setting.key]);
                          } else {
                            setSelectedSettings(selectedSettings.filter(k => k !== setting.key));
                          }
                        }}
                      />
                    }
                    label={`${setting.name} (${setting.key})`}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="New Value"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Reason for Change"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={selectedSettings.length === 0 || !bulkValue || loading}
        >
          {loading ? 'Updating...' : 'Update Settings'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SystemSettingsManager;