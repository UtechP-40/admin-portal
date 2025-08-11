import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
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
  Alert,
  Chip,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Grid,
} from '@mui/material';
import { 
  DataGrid, 
  GridToolbar,
  GridActionsCellItem
} from '@mui/x-data-grid';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid/models';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Block as BlockIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { securityService } from '../../services/securityService';
import type {
  IntrusionDetectionRule,
  SecuritySeverity,
  SecurityAlertCondition,
  SecurityAlertAction,
} from '../../types/security';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission } from '../../types/permissions';

const IntrusionDetectionPanel: React.FC = () => {
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<IntrusionDetectionRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testData, setTestData] = useState('');
  const [testResult, setTestResult] = useState<{ matched: boolean; details: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    severity: SecuritySeverity.MEDIUM,
    conditions: [] as SecurityAlertCondition[],
    actions: [] as SecurityAlertAction[],
  });

  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManageSecurity = hasPermission(Permission.SECURITY_MANAGE);

  // Queries
  const { data: rules = [], isLoading, error } = useQuery({
    queryKey: ['security', 'intrusion-detection', 'rules'],
    queryFn: () => securityService.getIntrusionDetectionRules(),
    enabled: hasPermission(Permission.SECURITY_VIEW),
  });

  // Mutations
  const createRuleMutation = useMutation({
    mutationFn: (rule: Omit<IntrusionDetectionRule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount' | 'lastTriggered'>) =>
      securityService.createIntrusionDetectionRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'intrusion-detection'] });
      handleCloseDialog();
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, rule }: { id: string; rule: Partial<IntrusionDetectionRule> }) =>
      securityService.updateIntrusionDetectionRule(id, rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'intrusion-detection'] });
      handleCloseDialog();
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => securityService.deleteIntrusionDetectionRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'intrusion-detection'] });
    },
  });

  const testRuleMutation = useMutation({
    mutationFn: ({ id, testData }: { id: string; testData: any }) =>
      securityService.testIntrusionDetectionRule(id, testData),
    onSuccess: (result) => {
      setTestResult(result);
    },
  });

  const getSeverityColor = (severity: SecuritySeverity) => {
    switch (severity) {
      case SecuritySeverity.CRITICAL:
        return 'error';
      case SecuritySeverity.HIGH:
        return 'warning';
      case SecuritySeverity.MEDIUM:
        return 'info';
      case SecuritySeverity.LOW:
        return 'success';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Rule Name',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'enabled',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Enabled' : 'Disabled'}
          size="small"
          color={params.value ? 'success' : 'default'}
          icon={params.value ? <CheckCircleIcon /> : <BlockIcon />}
        />
      ),
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          size="small"
          color={getSeverityColor(params.value)}
        />
      ),
    },
    {
      field: 'triggeredCount',
      headerName: 'Triggered',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'lastTriggered',
      headerName: 'Last Triggered',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value ? format(new Date(params.value), 'MMM dd, HH:mm') : 'Never'}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2">
          {format(new Date(params.value), 'MMM dd, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={<VisibilityIcon />}
          label="View Details"
          onClick={() => handleViewRule(params.row)}
        />,
        <GridActionsCellItem
          icon={<TestIcon />}
          label="Test Rule"
          onClick={() => handleTestRule(params.row)}
        />,
        ...(canManageSecurity ? [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit Rule"
            onClick={() => handleEditRule(params.row)}
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete Rule"
            onClick={() => handleDeleteRule(params.row.id)}
          />,
        ] : []),
      ],
    },
  ];

  const handleCreateRule = () => {
    setSelectedRule(null);
    setIsEditing(false);
    setFormData({
      name: '',
      description: '',
      enabled: true,
      severity: SecuritySeverity.MEDIUM,
      conditions: [],
      actions: [],
    });
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule: IntrusionDetectionRule) => {
    setSelectedRule(rule);
    setIsEditing(true);
    setFormData({
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      severity: rule.severity,
      conditions: rule.conditions,
      actions: rule.actions,
    });
    setRuleDialogOpen(true);
  };

  const handleViewRule = (rule: IntrusionDetectionRule) => {
    setSelectedRule(rule);
    setIsEditing(false);
    setFormData({
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      severity: rule.severity,
      conditions: rule.conditions,
      actions: rule.actions,
    });
    setRuleDialogOpen(true);
  };

  const handleTestRule = (rule: IntrusionDetectionRule) => {
    setSelectedRule(rule);
    setTestData('');
    setTestResult(null);
    setTestDialogOpen(true);
  };

  const handleDeleteRule = (id: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      deleteRuleMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setRuleDialogOpen(false);
    setSelectedRule(null);
    setIsEditing(false);
    setFormData({
      name: '',
      description: '',
      enabled: true,
      severity: SecuritySeverity.MEDIUM,
      conditions: [],
      actions: [],
    });
  };

  const handleSaveRule = () => {
    if (isEditing && selectedRule) {
      updateRuleMutation.mutate({
        id: selectedRule.id,
        rule: formData,
      });
    } else {
      createRuleMutation.mutate(formData);
    }
  };

  const handleTestRuleSubmit = () => {
    if (selectedRule && testData.trim()) {
      try {
        const parsedTestData = JSON.parse(testData);
        testRuleMutation.mutate({
          id: selectedRule.id,
          testData: parsedTestData,
        });
      } catch (error) {
        alert('Invalid JSON format in test data');
      }
    }
  };

  if (!hasPermission(Permission.SECURITY_VIEW)) {
    return (
      <Alert severity="error">
        You don't have permission to view intrusion detection rules.
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load intrusion detection rules: {error.message}
      </Alert>
    );
  }

  const enabledRules = rules.filter(rule => rule.enabled);
  const disabledRules = rules.filter(rule => !rule.enabled);
  const totalTriggered = rules.reduce((sum, rule) => sum + rule.triggeredCount, 0);

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon color="primary" />
              <Box>
                <Typography variant="h6">{rules.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Rules
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon color="success" />
              <Box>
                <Typography variant="h6">{enabledRules.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Enabled Rules
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <BlockIcon color="warning" />
              <Box>
                <Typography variant="h6">{disabledRules.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Disabled Rules
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WarningIcon color="error" />
              <Box>
                <Typography variant="h6">{totalTriggered.toLocaleString()}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Triggers
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Intrusion Detection Rules</Typography>
        {canManageSecurity && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateRule}
          >
            Create Rule
          </Button>
        )}
      </Box>

      {/* Data Grid */}
      <Paper>
        <DataGrid
          rows={rules}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: {
              sortModel: [{ field: 'triggeredCount', sort: 'desc' }],
            },
          }}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          sx={{ height: 600 }}
        />
      </Paper>

      {/* Rule Dialog */}
      <Dialog
        open={ruleDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Edit Rule' : selectedRule ? 'Rule Details' : 'Create New Rule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Rule Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              InputProps={{ readOnly: !isEditing && selectedRule }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
              required
              InputProps={{ readOnly: !isEditing && selectedRule }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={formData.severity}
                  label="Severity"
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as SecuritySeverity })}
                  readOnly={!isEditing && selectedRule}
                >
                  <MenuItem value={SecuritySeverity.LOW}>Low</MenuItem>
                  <MenuItem value={SecuritySeverity.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={SecuritySeverity.HIGH}>High</MenuItem>
                  <MenuItem value={SecuritySeverity.CRITICAL}>Critical</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    disabled={!isEditing && selectedRule}
                  />
                }
                label="Enabled"
              />
            </Box>
            
            {selectedRule && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Triggered Count"
                  value={selectedRule.triggeredCount}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Last Triggered"
                  value={selectedRule.lastTriggered ? format(new Date(selectedRule.lastTriggered), 'PPpp') : 'Never'}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Box>
            )}

            <Divider />
            
            <Typography variant="subtitle2">Conditions</Typography>
            <Alert severity="info">
              Rule conditions and actions configuration will be implemented in the next phase.
              For now, rules can be created with basic information.
            </Alert>
            
            <Typography variant="subtitle2">Actions</Typography>
            <Alert severity="info">
              Action configuration (email, webhook, block IP, etc.) will be available in the advanced configuration.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {selectedRule && !isEditing ? 'Close' : 'Cancel'}
          </Button>
          {(isEditing || !selectedRule) && canManageSecurity && (
            <Button
              onClick={handleSaveRule}
              variant="contained"
              disabled={!formData.name.trim() || !formData.description.trim() || createRuleMutation.isPending || updateRuleMutation.isPending}
            >
              {createRuleMutation.isPending || updateRuleMutation.isPending ? 'Saving...' : 'Save Rule'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Test Rule Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Test Rule: {selectedRule?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Alert severity="info">
              Enter test data in JSON format to simulate an event and see if this rule would trigger.
            </Alert>
            <TextField
              label="Test Data (JSON)"
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              multiline
              rows={8}
              fullWidth
              placeholder={`{
  "sourceIp": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "requestPath": "/admin/login",
  "method": "POST",
  "statusCode": 401,
  "timestamp": "${new Date().toISOString()}"
}`}
            />
            {testResult && (
              <Alert severity={testResult.matched ? 'warning' : 'success'}>
                <Typography variant="body2">
                  <strong>Result:</strong> {testResult.matched ? 'Rule would trigger' : 'Rule would not trigger'}
                </Typography>
                <Typography variant="body2">
                  <strong>Details:</strong> {testResult.details}
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
          <Button
            onClick={handleTestRuleSubmit}
            variant="contained"
            disabled={!testData.trim() || testRuleMutation.isPending}
          >
            {testRuleMutation.isPending ? 'Testing...' : 'Test Rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntrusionDetectionPanel;