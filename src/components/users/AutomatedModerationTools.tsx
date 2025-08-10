import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Security as SecurityIcon,
  AutoMode as AutoModeIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Flag as FlagIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementApi } from '../../services/userManagementApi';

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
      id={`moderation-tabpanel-${index}`}
      aria-labelledby={`moderation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ModerationRule {
  id: string;
  name: string;
  description: string;
  conditions: any[];
  actions: any[];
  severity: 'low' | 'medium' | 'high';
  isActive: boolean;
  triggeredCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ModerationAction {
  id: string;
  userId: string;
  username: string;
  ruleId: string;
  ruleName: string;
  actionType: string;
  reason: string;
  severity: string;
  status: string;
  executedAt: string;
}

const AutomatedModerationTools: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ModerationRule | null>(null);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Rule form state
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    conditions: [{ field: '', operator: '', value: '' }],
    actions: [{ type: '', parameters: {} }],
    severity: 'medium' as 'low' | 'medium' | 'high',
    isActive: true
  });

  const queryClient = useQueryClient();

  // Fetch moderation rules
  const { data: moderationRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['moderationRules'],
    queryFn: () => userManagementApi.getModerationRules()
  });

  // Fetch moderation actions
  const { data: moderationActions, isLoading: actionsLoading } = useQuery({
    queryKey: ['moderationActions'],
    queryFn: () => userManagementApi.getModerationActions()
  });

  // Fetch moderation statistics
  const { data: moderationStats } = useQuery({
    queryKey: ['moderationStatistics'],
    queryFn: () => userManagementApi.getModerationStatistics()
  });

  // Create/Update rule mutation
  const saveRuleMutation = useMutation({
    mutationFn: (rule: any) => {
      if (selectedRule) {
        return userManagementApi.updateModerationRule(selectedRule.id, rule);
      } else {
        return userManagementApi.createModerationRule(rule);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationRules'] });
      queryClient.invalidateQueries({ queryKey: ['moderationStatistics'] });
      setRuleDialogOpen(false);
      resetRuleForm();
    }
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => userManagementApi.deleteModerationRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationRules'] });
      queryClient.invalidateQueries({ queryKey: ['moderationStatistics'] });
    }
  });

  // Toggle rule mutation
  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userManagementApi.toggleModerationRule(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationRules'] });
    }
  });

  // Execute moderation action mutation
  const executeModerationMutation = useMutation({
    mutationFn: (action: any) => userManagementApi.executeModerationAction(action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationActions'] });
      queryClient.invalidateQueries({ queryKey: ['moderationStatistics'] });
    }
  });

  // Bulk moderation action mutation
  const bulkModerationMutation = useMutation({
    mutationFn: ({ userIds, action }: { userIds: string[]; action: any }) =>
      userManagementApi.bulkModerationAction(userIds, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationActions'] });
      queryClient.invalidateQueries({ queryKey: ['moderationStatistics'] });
      setBulkActionDialogOpen(false);
      setSelectedUsers([]);
    }
  });

  // Enhanced ban management mutation
  const enhancedBanMutation = useMutation({
    mutationFn: ({ userId, banData }: { userId: string; banData: any }) =>
      userManagementApi.banGameUser(userId, banData.reason, banData.duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationActions'] });
      queryClient.invalidateQueries({ queryKey: ['moderationStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['gameUsers'] });
    }
  });

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: (userId: string) => userManagementApi.unbanGameUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationActions'] });
      queryClient.invalidateQueries({ queryKey: ['moderationStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['gameUsers'] });
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const resetRuleForm = () => {
    setRuleForm({
      name: '',
      description: '',
      conditions: [{ field: '', operator: '', value: '' }],
      actions: [{ type: '', parameters: {} }],
      severity: 'medium',
      isActive: true
    });
    setSelectedRule(null);
  };

  const handleCreateRule = () => {
    setSelectedRule(null);
    resetRuleForm();
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule: ModerationRule) => {
    setSelectedRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description,
      conditions: rule.conditions,
      actions: rule.actions,
      severity: rule.severity,
      isActive: rule.isActive
    });
    setRuleDialogOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this moderation rule?')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const handleToggleRule = (ruleId: string, isActive: boolean) => {
    toggleRuleMutation.mutate({ id: ruleId, isActive });
  };

  const handleSaveRule = () => {
    saveRuleMutation.mutate(ruleForm);
  };

  const addCondition = () => {
    setRuleForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: '', value: '' }]
    }));
  };

  const removeCondition = (index: number) => {
    setRuleForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, field: string, value: any) => {
    setRuleForm(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const addAction = () => {
    setRuleForm(prev => ({
      ...prev,
      actions: [...prev.actions, { type: '', parameters: {} }]
    }));
  };

  const removeAction = (index: number) => {
    setRuleForm(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const updateAction = (index: number, field: string, value: any) => {
    setRuleForm(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'warn': return <WarningIcon />;
      case 'flag': return <FlagIcon />;
      case 'ban': return <BlockIcon />;
      default: return <SecurityIcon />;
    }
  };

  // Rules columns
  const rulesColumns: GridColDef[] = [
    { field: 'name', headerName: 'Rule Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getSeverityColor(params.value) as any}
          size="small"
        />
      )
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={(e) => handleToggleRule(params.row.id, e.target.checked)}
          size="small"
        />
      )
    },
    { field: 'triggeredCount', headerName: 'Triggered', width: 100 },
    {
      field: 'updatedAt',
      headerName: 'Last Updated',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEditRule(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteRule(params.row.id)}
        />
      ]
    }
  ];

  // Actions columns
  const actionsColumns: GridColDef[] = [
    { field: 'username', headerName: 'User', width: 150 },
    { field: 'ruleName', headerName: 'Rule', width: 200 },
    {
      field: 'actionType',
      headerName: 'Action',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getActionTypeIcon(params.value)}
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      )
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getSeverityColor(params.value) as any}
          size="small"
        />
      )
    },
    { field: 'reason', headerName: 'Reason', width: 250 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'executed' ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'executedAt',
      headerName: 'Executed',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoModeIcon />
        Automated Moderation Tools
      </Typography>

      {/* Statistics Cards */}
      {moderationStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Rules
                </Typography>
                <Typography variant="h4">
                  {moderationStats.activeRules}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Actions Today
                </Typography>
                <Typography variant="h4">
                  {moderationStats.actionsToday}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Users Flagged
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {moderationStats.usersFlagged}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Auto Bans
                </Typography>
                <Typography variant="h4" color="error.main">
                  {moderationStats.autoBans}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Moderation Rules" icon={<SettingsIcon />} iconPosition="start" />
            <Tab label="Action History" icon={<TimelineIcon />} iconPosition="start" />
            <Tab label="Ban Management" icon={<BlockIcon />} iconPosition="start" />
            <Tab label="Analytics" icon={<AnalyticsIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Moderation Rules</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateRule}
            >
              Create Rule
            </Button>
          </Box>
          <DataGrid
            rows={moderationRules || []}
            columns={rulesColumns}
            loading={rulesLoading}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Moderation Action History</Typography>
            {selectedUsers.length > 0 && (
              <Button
                variant="outlined"
                onClick={() => setBulkActionDialogOpen(true)}
              >
                Bulk Action ({selectedUsers.length})
              </Button>
            )}
          </Box>
          <DataGrid
            rows={moderationActions || []}
            columns={actionsColumns}
            loading={actionsLoading}
            pageSizeOptions={[10, 25, 50]}
            checkboxSelection
            onRowSelectionModelChange={(newSelection) => {
              setSelectedUsers(newSelection as string[]);
            }}
            autoHeight
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Enhanced Ban Management
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Quick Ban Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<BlockIcon />}
                      onClick={() => {
                        const userId = prompt('Enter User ID to ban:');
                        const reason = prompt('Enter ban reason:');
                        if (userId && reason) {
                          enhancedBanMutation.mutate({ userId, banData: { reason } });
                        }
                      }}
                    >
                      Quick Ban User
                    </Button>
                    <Button
                      variant="outlined"
                      color="success"
                      onClick={() => {
                        const userId = prompt('Enter User ID to unban:');
                        if (userId) {
                          unbanUserMutation.mutate(userId);
                        }
                      }}
                    >
                      Quick Unban User
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<BlockIcon />}
                      onClick={() => {
                        if (window.confirm('This will ban all users with high suspicious activity scores. Continue?')) {
                          executeModerationMutation.mutate({
                            userId: 'bulk',
                            actionType: 'ban',
                            reason: 'Automated ban for high suspicious activity',
                            severity: 'high'
                          });
                        }
                      }}
                    >
                      Auto-Ban High Risk Users
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Ban Statistics
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      Total Bans: {moderationStats?.autoBans || 0}
                    </Typography>
                    <Typography variant="body2">
                      Active Bans: {moderationStats?.activeBans || 0}
                    </Typography>
                    <Typography variant="body2">
                      Temporary Bans: {moderationStats?.temporaryBans || 0}
                    </Typography>
                    <Typography variant="body2">
                      Permanent Bans: {moderationStats?.permanentBans || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                Enhanced ban management allows for more sophisticated ban policies, appeal processes, and automated ban reviews.
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Moderation Analytics
          </Typography>
          <Alert severity="info">
            Analytics dashboard showing moderation effectiveness, rule performance, and trends will be implemented here.
          </Alert>
        </TabPanel>
      </Paper>

      {/* Rule Creation/Edit Dialog */}
      <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRule ? 'Edit Moderation Rule' : 'Create Moderation Rule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Name"
                value={ruleForm.name}
                onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={ruleForm.description}
                onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={ruleForm.severity}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, severity: e.target.value as any }))}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={ruleForm.isActive}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active"
              />
            </Grid>

            {/* Conditions */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Conditions
              </Typography>
              {ruleForm.conditions.map((condition, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Field</InputLabel>
                    <Select
                      value={condition.field}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    >
                      <MenuItem value="gamesPlayed">Games Played</MenuItem>
                      <MenuItem value="winRate">Win Rate</MenuItem>
                      <MenuItem value="suspiciousScore">Suspicious Score</MenuItem>
                      <MenuItem value="reportCount">Report Count</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    >
                      <MenuItem value="gt">Greater than</MenuItem>
                      <MenuItem value="lt">Less than</MenuItem>
                      <MenuItem value="eq">Equals</MenuItem>
                      <MenuItem value="gte">Greater or equal</MenuItem>
                      <MenuItem value="lte">Less or equal</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Value"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    sx={{ minWidth: 100 }}
                  />
                  <IconButton onClick={() => removeCondition(index)} disabled={ruleForm.conditions.length === 1}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button onClick={addCondition} startIcon={<AddIcon />} size="small">
                Add Condition
              </Button>
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Actions
              </Typography>
              {ruleForm.actions.map((action, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Action Type</InputLabel>
                    <Select
                      value={action.type}
                      onChange={(e) => updateAction(index, 'type', e.target.value)}
                    >
                      <MenuItem value="warn">Warn User</MenuItem>
                      <MenuItem value="flag">Flag User</MenuItem>
                      <MenuItem value="ban">Ban User</MenuItem>
                      <MenuItem value="restrict">Restrict User</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton onClick={() => removeAction(index)} disabled={ruleForm.actions.length === 1}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button onClick={addAction} startIcon={<AddIcon />} size="small">
                Add Action
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveRule}
            variant="contained"
            disabled={!ruleForm.name || saveRuleMutation.isPending}
          >
            {saveRuleMutation.isPending ? 'Saving...' : 'Save Rule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialogOpen} onClose={() => setBulkActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Moderation Action</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Apply moderation action to {selectedUsers.length} selected users.
          </Typography>
          {/* Bulk action form would go here */}
          <Alert severity="warning" sx={{ mt: 2 }}>
            Bulk moderation actions will be applied immediately and cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning">
            Execute Action
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutomatedModerationTools;