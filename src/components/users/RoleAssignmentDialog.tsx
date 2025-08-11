import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Checkbox,
  IconButton,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementApi } from '../../services/userManagementApi';
import type { RoleTemplate, AdminUser } from '../../services/userManagementApi';

interface RoleAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  selectedRole?: RoleTemplate;
  selectedUsers?: string[];
  mode?: 'assign-role' | 'assign-users' | 'bulk-permissions';
}

interface BulkPermissionUpdate {
  userIds: string[];
  addPermissions: string[];
  removePermissions: string[];
  replacePermissions: string[];
}

const RoleAssignmentDialog: React.FC<RoleAssignmentDialogProps> = ({
  open,
  onClose,
  selectedRole,
  selectedUsers = [],
  mode = 'assign-role'
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(selectedRole?.id || '');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(selectedUsers);
  const [bulkUpdate, setBulkUpdate] = useState<BulkPermissionUpdate>({
    userIds: selectedUsers,
    addPermissions: [],
    removePermissions: [],
    replacePermissions: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [operationResults, setOperationResults] = useState<{
    successful: string[];
    failed: { userId: string; error: string }[];
  } | null>(null);

  const queryClient = useQueryClient();

  // Fetch role templates
  const { data: roleTemplates } = useQuery({
    queryKey: ['roleTemplates'],
    queryFn: () => userManagementApi.getRoleTemplates()
  });

  // Fetch admin users
  const { data: adminUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => userManagementApi.getAdminUsers()
  });

  // Fetch users for selected role
  const { data: roleUsers } = useQuery({
    queryKey: ['roleUsers', selectedRoleId],
    queryFn: () => selectedRoleId ? userManagementApi.getUsersByRole(selectedRoleId) : Promise.resolve([]),
    enabled: !!selectedRoleId && mode === 'assign-role'
  });

  // Assign role to users mutation
  const assignRoleMutation = useMutation({
    mutationFn: ({ userIds, roleId }: { userIds: string[]; roleId: string }) =>
      userManagementApi.assignRoleToUsers(userIds, roleId),
    onSuccess: (result) => {
      setOperationResults(result);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['roleUsers'] });
      queryClient.invalidateQueries({ queryKey: ['roleUsageStatistics'] });
    }
  });

  // Bulk update permissions mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: userManagementApi.bulkUpdatePermissions,
    onSuccess: (result) => {
      setOperationResults(result);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }
  });

  // Remove role from user mutation
  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      userManagementApi.removeRoleFromUser(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['roleUsers'] });
    }
  });

  useEffect(() => {
    if (selectedRole) {
      setSelectedRoleId(selectedRole.id);
    }
  }, [selectedRole]);

  useEffect(() => {
    setSelectedUserIds(selectedUsers);
    setBulkUpdate(prev => ({ ...prev, userIds: selectedUsers }));
  }, [selectedUsers]);

  const handleAssignRole = () => {
    if (selectedRoleId && selectedUserIds.length > 0) {
      assignRoleMutation.mutate({ userIds: selectedUserIds, roleId: selectedRoleId });
    }
  };

  const handleBulkUpdatePermissions = () => {
    if (bulkUpdate.userIds.length > 0) {
      bulkUpdateMutation.mutate(bulkUpdate);
    }
  };

  const handleRemoveRoleFromUser = (userId: string) => {
    if (selectedRoleId) {
      removeRoleMutation.mutate({ userId, roleId: selectedRoleId });
    }
  };

  const filteredUsers = adminUsers?.users?.filter((user: AdminUser) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const availableUsers = filteredUsers.filter((user: AdminUser) =>
    !roleUsers?.some(ru => ru.id === user.id)
  );

  const renderAssignRoleMode = () => (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Role</InputLabel>
        <Select
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
        >
          {roleTemplates?.map((role) => (
            <MenuItem key={role.id} value={role.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon />
                {role.name}
                <Chip label={`${role.permissions.length} perms`} size="small" />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedRoleId && (
        <>
          <Typography variant="h6" gutterBottom>
            Current Users with this Role ({roleUsers?.length || 0})
          </Typography>
          <List sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
            {roleUsers?.map((user) => (
              <ListItem key={user.id}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary={user.fullName}
                  secondary={user.email}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveRoleFromUser(user.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Assign Role to Users
          </Typography>
          <TextField
            label="Search Users"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {availableUsers.map((user) => (
              <ListItem key={user.id}>
                <ListItemIcon>
                  <Checkbox
                    checked={selectedUserIds.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUserIds(prev => [...prev, user.id]);
                      } else {
                        setSelectedUserIds(prev => prev.filter(id => id !== user.id));
                      }
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={user.fullName}
                  secondary={
                    <Box>
                      <Typography variant="body2">{user.email}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        {user.permissions.slice(0, 3).map(perm => (
                          <Chip key={perm} label={perm} size="small" />
                        ))}
                        {user.permissions.length > 3 && (
                          <Chip label={`+${user.permissions.length - 3}`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );

  const renderBulkPermissionsMode = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Bulk Permission Updates
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Selected {bulkUpdate.userIds.length} users for bulk permission updates
      </Alert>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Add Permissions ({bulkUpdate.addPermissions.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1}>
            {Object.values(userManagementApi).map((permission) => (
              <Grid item xs={12} sm={6} key={permission}>
                <FormControl>
                  <Checkbox
                    checked={bulkUpdate.addPermissions.includes(permission)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkUpdate(prev => ({
                          ...prev,
                          addPermissions: [...prev.addPermissions, permission]
                        }));
                      } else {
                        setBulkUpdate(prev => ({
                          ...prev,
                          addPermissions: prev.addPermissions.filter(p => p !== permission)
                        }));
                      }
                    }}
                  />
                  <Typography variant="body2">{permission}</Typography>
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Remove Permissions ({bulkUpdate.removePermissions.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1}>
            {Object.values(userManagementApi).map((permission) => (
              <Grid item xs={12} sm={6} key={permission}>
                <FormControl>
                  <Checkbox
                    checked={bulkUpdate.removePermissions.includes(permission)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkUpdate(prev => ({
                          ...prev,
                          removePermissions: [...prev.removePermissions, permission]
                        }));
                      } else {
                        setBulkUpdate(prev => ({
                          ...prev,
                          removePermissions: prev.removePermissions.filter(p => p !== permission)
                        }));
                      }
                    }}
                  />
                  <Typography variant="body2">{permission}</Typography>
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  const renderOperationResults = () => {
    if (!operationResults) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Operation Results
        </Typography>
        
        {operationResults.successful.length > 0 && (
          <Alert severity="success" sx={{ mb: 1 }}>
            <Typography variant="body2">
              Successfully processed {operationResults.successful.length} users
            </Typography>
          </Alert>
        )}

        {operationResults.failed.length > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            <Typography variant="body2" gutterBottom>
              Failed to process {operationResults.failed.length} users:
            </Typography>
            <List dense>
              {operationResults.failed.map((failure, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`User ID: ${failure.userId}`}
                    secondary={failure.error}
                  />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}
      </Box>
    );
  };

  const getDialogTitle = () => {
    switch (mode) {
      case 'assign-role':
        return 'Role Assignment';
      case 'assign-users':
        return 'Assign Users to Role';
      case 'bulk-permissions':
        return 'Bulk Permission Updates';
      default:
        return 'Role Management';
    }
  };

  const getActionButton = () => {
    switch (mode) {
      case 'assign-role':
        return (
          <Button
            onClick={handleAssignRole}
            variant="contained"
            disabled={!selectedRoleId || selectedUserIds.length === 0 || assignRoleMutation.isPending}
            startIcon={<AssignmentIcon />}
          >
            Assign Role ({selectedUserIds.length} users)
          </Button>
        );
      case 'bulk-permissions':
        return (
          <Button
            onClick={handleBulkUpdatePermissions}
            variant="contained"
            disabled={
              bulkUpdate.userIds.length === 0 ||
              (bulkUpdate.addPermissions.length === 0 && 
               bulkUpdate.removePermissions.length === 0 && 
               bulkUpdate.replacePermissions.length === 0) ||
              bulkUpdateMutation.isPending
            }
            startIcon={<GroupIcon />}
          >
            Update Permissions
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{getDialogTitle()}</DialogTitle>
      <DialogContent>
        {assignRoleMutation.isPending || bulkUpdateMutation.isPending && (
          <LinearProgress sx={{ mb: 2 }} />
        )}
        
        {mode === 'assign-role' && renderAssignRoleMode()}
        {mode === 'bulk-permissions' && renderBulkPermissionsMode()}
        
        {renderOperationResults()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {operationResults ? 'Close' : 'Cancel'}
        </Button>
        {!operationResults && getActionButton()}
      </DialogActions>
    </Dialog>
  );
};

export default RoleAssignmentDialog;