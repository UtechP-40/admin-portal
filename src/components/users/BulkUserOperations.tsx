import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementApi } from '../../services/userManagementApi';

interface BulkUserOperationsProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: string[];
  roleTemplates: any[];
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
      id={`bulk-operations-tabpanel-${index}`}
      aria-labelledby={`bulk-operations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BulkUserOperations: React.FC<BulkUserOperationsProps> = ({
  open,
  onClose,
  selectedUsers,
  roleTemplates
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [bulkEditData, setBulkEditData] = useState({
    status: '',
    permissions: [] as string[],
    addPermissions: true // true for add, false for remove
  });
  const [importData, setImportData] = useState('');
  const [exportFormat, setExportFormat] = useState('json');
  const [operationResults, setOperationResults] = useState<{
    success: string[];
    errors: { id: string; error: string }[];
  }>({ success: [], errors: [] });

  const queryClient = useQueryClient();

  // Bulk update status mutation
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({ userIds, status }: { userIds: string[]; status: string }) =>
      userManagementApi.bulkUpdateStatus(userIds, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setOperationResults({ success: data.success || [], errors: data.errors || [] });
    }
  });

  // Bulk assign permissions mutation
  const bulkAssignPermissionsMutation = useMutation({
    mutationFn: ({ userIds, permissions }: { userIds: string[]; permissions: string[] }) =>
      userManagementApi.bulkAssignPermissions(userIds, permissions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setOperationResults({ success: data.success || [], errors: data.errors || [] });
    }
  });

  // Bulk import users mutation
  const bulkImportMutation = useMutation({
    mutationFn: (users: any[]) => userManagementApi.bulkImportUsers(users),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      setOperationResults({ success: data.success || [], errors: data.errors || [] });
    }
  });

  // Export users mutation
  const exportUsersMutation = useMutation({
    mutationFn: ({ userIds, format }: { userIds: string[]; format: string }) =>
      userManagementApi.exportUsers(userIds, format),
    onSuccess: (data) => {
      // Create download link
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setOperationResults({ success: [], errors: [] });
  };

  const handleBulkStatusUpdate = () => {
    if (bulkEditData.status && selectedUsers.length > 0) {
      bulkUpdateStatusMutation.mutate({
        userIds: selectedUsers,
        status: bulkEditData.status
      });
    }
  };

  const handleBulkPermissionsUpdate = () => {
    if (bulkEditData.permissions.length > 0 && selectedUsers.length > 0) {
      if (bulkEditData.addPermissions) {
        bulkAssignPermissionsMutation.mutate({
          userIds: selectedUsers,
          permissions: bulkEditData.permissions
        });
      } else {
        // For removing permissions, we'd need a separate API endpoint
        // This is a placeholder for the remove permissions functionality
        console.log('Remove permissions not implemented yet');
      }
    }
  };

  const handleImportUsers = () => {
    try {
      const users = JSON.parse(importData);
      if (Array.isArray(users)) {
        bulkImportMutation.mutate(users);
      } else {
        setOperationResults({
          success: [],
          errors: [{ id: 'import', error: 'Invalid JSON format. Expected an array of users.' }]
        });
      }
    } catch (error) {
      setOperationResults({
        success: [],
        errors: [{ id: 'import', error: 'Invalid JSON format.' }]
      });
    }
  };

  const handleExportUsers = () => {
    if (selectedUsers.length > 0) {
      exportUsersMutation.mutate({
        userIds: selectedUsers,
        format: exportFormat
      });
    }
  };

  const addPermissionToBulkEdit = (permission: string) => {
    if (!bulkEditData.permissions.includes(permission)) {
      setBulkEditData({
        ...bulkEditData,
        permissions: [...bulkEditData.permissions, permission]
      });
    }
  };

  const removePermissionFromBulkEdit = (permission: string) => {
    setBulkEditData({
      ...bulkEditData,
      permissions: bulkEditData.permissions.filter(p => p !== permission)
    });
  };

  const availablePermissions = [
    'user_management',
    'system_configuration',
    'analytics_view',
    'database_management',
    'api_testing',
    'game_monitoring',
    'security_management',
    'audit_logs'
  ];

  const isLoading = bulkUpdateStatusMutation.isPending || 
                   bulkAssignPermissionsMutation.isPending || 
                   bulkImportMutation.isPending || 
                   exportUsersMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon />
          Bulk User Operations
          {selectedUsers.length > 0 && (
            <Chip label={`${selectedUsers.length} users selected`} color="primary" size="small" />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Bulk Edit" icon={<EditIcon />} iconPosition="start" />
            <Tab label="Import" icon={<UploadIcon />} iconPosition="start" />
            <Tab label="Export" icon={<DownloadIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {isLoading && <LinearProgress sx={{ mt: 2 }} />}

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Update Status
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>New Status</InputLabel>
                  <Select
                    value={bulkEditData.status}
                    onChange={(e) => setBulkEditData({ ...bulkEditData, status: e.target.value })}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleBulkStatusUpdate}
                  disabled={!bulkEditData.status || selectedUsers.length === 0 || isLoading}
                  fullWidth
                >
                  Update Status for {selectedUsers.length} Users
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Update Permissions
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Operation</InputLabel>
                  <Select
                    value={bulkEditData.addPermissions ? 'add' : 'remove'}
                    onChange={(e) => setBulkEditData({ 
                      ...bulkEditData, 
                      addPermissions: e.target.value === 'add' 
                    })}
                  >
                    <MenuItem value="add">Add Permissions</MenuItem>
                    <MenuItem value="remove">Remove Permissions</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="subtitle2" gutterBottom>
                  Available Permissions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {availablePermissions.map((permission) => (
                    <Chip
                      key={permission}
                      label={permission.replace('_', ' ').toUpperCase()}
                      onClick={() => addPermissionToBulkEdit(permission)}
                      color={bulkEditData.permissions.includes(permission) ? 'primary' : 'default'}
                      variant={bulkEditData.permissions.includes(permission) ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Selected Permissions ({bulkEditData.permissions.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {bulkEditData.permissions.map((permission) => (
                    <Chip
                      key={permission}
                      label={permission.replace('_', ' ').toUpperCase()}
                      onDelete={() => removePermissionFromBulkEdit(permission)}
                      color="primary"
                      size="small"
                    />
                  ))}
                </Box>

                <Button
                  variant="contained"
                  onClick={handleBulkPermissionsUpdate}
                  disabled={bulkEditData.permissions.length === 0 || selectedUsers.length === 0 || isLoading}
                  fullWidth
                >
                  {bulkEditData.addPermissions ? 'Add' : 'Remove'} Permissions for {selectedUsers.length} Users
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Import Users from JSON
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Import users by providing a JSON array. Each user should have: username, email, firstName, lastName, permissions.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={10}
            label="JSON Data"
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder={`[
  {
    "username": "john.doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "permissions": ["user_management", "analytics_view"]
  }
]`}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleImportUsers}
            disabled={!importData.trim() || isLoading}
            startIcon={<UploadIcon />}
          >
            Import Users
          </Button>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Export Selected Users
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleExportUsers}
            disabled={selectedUsers.length === 0 || isLoading}
            startIcon={<DownloadIcon />}
          >
            Export {selectedUsers.length} Users
          </Button>
        </TabPanel>

        {/* Operation Results */}
        {(operationResults.success.length > 0 || operationResults.errors.length > 0) && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Operation Results
            </Typography>
            
            {operationResults.success.length > 0 && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Successfully processed {operationResults.success.length} users
                </Typography>
                <List dense>
                  {operationResults.success.slice(0, 5).map((userId) => (
                    <ListItem key={userId}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary={userId} />
                    </ListItem>
                  ))}
                  {operationResults.success.length > 5 && (
                    <ListItem>
                      <ListItemText primary={`... and ${operationResults.success.length - 5} more`} />
                    </ListItem>
                  )}
                </List>
              </Alert>
            )}

            {operationResults.errors.length > 0 && (
              <Alert severity="error">
                <Typography variant="subtitle2" gutterBottom>
                  Failed to process {operationResults.errors.length} users
                </Typography>
                <List dense>
                  {operationResults.errors.slice(0, 5).map((error) => (
                    <ListItem key={error.id}>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={error.id} 
                        secondary={error.error}
                      />
                    </ListItem>
                  ))}
                  {operationResults.errors.length > 5 && (
                    <ListItem>
                      <ListItemText primary={`... and ${operationResults.errors.length - 5} more errors`} />
                    </ListItem>
                  )}
                </List>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkUserOperations;