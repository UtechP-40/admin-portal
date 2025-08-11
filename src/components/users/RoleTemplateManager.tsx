import React, { useState, useEffect } from 'react';
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
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormControlLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,

  Menu,
  MenuItem as MenuItemComponent,
  Breadcrumbs,
  Link,
  Badge,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  AccountTree as HierarchyIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid/models';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { userManagementApi } from '../../services/userManagementApi';
import type { RoleTemplate } from '../../services/userManagementApi';
import { PERMISSION_GROUPS, PERMISSION_DESCRIPTIONS } from '../../types/permissions';
import type { Permission } from '../../types/permissions';

interface RoleTemplateManagerProps {
  open?: boolean;
  onClose?: () => void;
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
  parentRoleId?: string;
  isDefault: boolean;
}

const RoleTemplateManager: React.FC<RoleTemplateManagerProps> = ({ open = true, onClose }) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [hierarchyDialogOpen, setHierarchyDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleTemplate | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
    parentRoleId: undefined,
    isDefault: false
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
  });
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState<null | HTMLElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'hierarchy'>('grid');

  const queryClient = useQueryClient();

  // Fetch role templates
  const { data: roleTemplates, isLoading } = useQuery({
    queryKey: ['roleTemplates'],
    queryFn: () => userManagementApi.getRoleTemplates()
  });

  // Fetch role hierarchy
  const { data: roleHierarchy } = useQuery({
    queryKey: ['roleHierarchy'],
    queryFn: () => userManagementApi.getRoleHierarchy()
  });

  // Fetch role usage statistics
  const { data: roleStats } = useQuery({
    queryKey: ['roleUsageStatistics'],
    queryFn: () => userManagementApi.getRoleUsageStatistics()
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: userManagementApi.createRoleTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['roleHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['roleUsageStatistics'] });
      setCreateDialogOpen(false);
      resetForm();
      setSnackbar({ open: true, message: 'Role template created successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to create role template', severity: 'error' });
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userManagementApi.updateRoleTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['roleHierarchy'] });
      setEditDialogOpen(false);
      resetForm();
      setSnackbar({ open: true, message: 'Role template updated successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to update role template', severity: 'error' });
    }
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: userManagementApi.deleteRoleTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['roleHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['roleUsageStatistics'] });
      setSnackbar({ open: true, message: 'Role template deleted successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to delete role template', severity: 'error' });
    }
  });

  // Duplicate role mutation
  const duplicateRoleMutation = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) => 
      userManagementApi.duplicateRoleTemplate(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleTemplates'] });
      setSnackbar({ open: true, message: 'Role template duplicated successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to duplicate role template', severity: 'error' });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      parentRoleId: undefined,
      isDefault: false
    });
    setSelectedRole(null);
  };

  const handleCreateRole = () => {
    createRoleMutation.mutate(formData);
  };

  const handleUpdateRole = () => {
    if (selectedRole) {
      updateRoleMutation.mutate({ id: selectedRole.id, data: formData });
    }
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roleTemplates?.find(r => r.id === roleId);
    if (role?.usageCount > 0) {
      setSnackbar({ 
        open: true, 
        message: `Cannot delete role "${role.name}" as it is assigned to ${role.usageCount} users`, 
        severity: 'warning' 
      });
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this role template?')) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  const handleDuplicateRole = (role: RoleTemplate) => {
    const newName = prompt('Enter name for the duplicated role:', `${role.name} (Copy)`);
    if (newName) {
      duplicateRoleMutation.mutate({ id: role.id, newName });
    }
  };

  const handleEditRole = (role: RoleTemplate) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      parentRoleId: role.parentRoleId,
      isDefault: role.isDefault
    });
    setEditDialogOpen(true);
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // Role template columns for data grid
  const columns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Role Name', 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          {params.row.isDefault && (
            <Chip label="Default" size="small" color="primary" />
          )}
        </Box>
      )
    },
    { field: 'description', headerName: 'Description', width: 300 },
    {
      field: 'level',
      headerName: 'Level',
      width: 80,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value === 0 ? 'primary' : 'default'} 
        />
      )
    },
    {
      field: 'permissions',
      headerName: 'Permissions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Chip 
            label={`${params.value.length} permissions`} 
            size="small" 
            variant="outlined" 
          />
        </Box>
      )
    },
    {
      field: 'usageCount',
      headerName: 'Users',
      width: 100,
      renderCell: (params) => (
        <Badge badgeContent={params.value} color="primary">
          <PeopleIcon />
        </Badge>
      )
    },
    {
      field: 'parentRoleId',
      headerName: 'Parent Role',
      width: 150,
      renderCell: (params) => {
        if (!params.value) return <Typography variant="body2" color="textSecondary">None</Typography>;
        const parentRole = roleTemplates?.find(r => r.id === params.value);
        return parentRole ? (
          <Chip label={parentRole.name} size="small" variant="outlined" />
        ) : (
          <Typography variant="body2" color="error">Invalid</Typography>
        );
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 200,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<ViewIcon />}
          label="View Details"
          onClick={() => {
            setSelectedRole(params.row);
            setHierarchyDialogOpen(true);
          }}
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEditRole(params.row)}
        />,
        <GridActionsCellItem
          icon={<CopyIcon />}
          label="Duplicate"
          onClick={() => handleDuplicateRole(params.row)}
        />,
        <GridActionsCellItem
          icon={<AssignmentIcon />}
          label="Assign to Users"
          onClick={() => {
            setSelectedRole(params.row);
            setAssignmentDialogOpen(true);
          }}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteRole(params.row.id)}
          disabled={params.row.isDefault || params.row.usageCount > 0}
        />
      ]
    }
  ];

  const renderPermissionGroups = () => (
    <Box>
      {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
        <Accordion key={groupName}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1">{groupName}</Typography>
              <Chip 
                label={`${formData.permissions.filter(p => permissions.includes(p as Permission)).length}/${permissions.length}`}
                size="small"
                color={formData.permissions.filter(p => permissions.includes(p as Permission)).length > 0 ? 'primary' : 'default'}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={1}>
              {permissions.map((permission) => (
                <Grid item xs={12} sm={6} key={permission}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.permissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">{permission}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {PERMISSION_DESCRIPTIONS[permission as Permission]}
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );

  const renderRoleHierarchy = () => {
    if (!roleHierarchy) return null;

    const buildTreeItems = (roleId: string, level = 0): React.ReactNode => {
      const role = roleHierarchy.roles.find(r => r.id === roleId);
      if (!role) return null;

      const children = roleHierarchy.hierarchy[roleId] || [];

      return (
        <Box key={roleId} sx={{ ml: level * 2, mb: 1 }}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon color="primary" />
              <Typography variant="body2" fontWeight="medium">{role.name}</Typography>
              <Chip label={`${role.permissions.length} perms`} size="small" />
              <Chip label={`${role.usageCount} users`} size="small" color="primary" />
            </Box>
            {role.description && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                {role.description}
              </Typography>
            )}
          </Card>
          {children.length > 0 && (
            <Box sx={{ ml: 2, mt: 1 }}>
              {children.map(childId => buildTreeItems(childId, level + 1))}
            </Box>
          )}
        </Box>
      );
    };

    const rootRoles = roleHierarchy.roles.filter(r => !r.parentRoleId);

    return (
      <Box>
        {rootRoles.map(role => buildTreeItems(role.id))}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            Role Template Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={viewMode === 'hierarchy'}
                  onChange={(e) => setViewMode(e.target.checked ? 'hierarchy' : 'grid')}
                />
              }
              label="Hierarchy View"
            />
            <Button
              variant="outlined"
              startIcon={<HierarchyIcon />}
              onClick={() => setHierarchyDialogOpen(true)}
            >
              View Hierarchy
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Role Template
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        {roleStats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Roles
                  </Typography>
                  <Typography variant="h4">
                    {roleStats.roleUsage.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Permissions
                  </Typography>
                  <Typography variant="h4">
                    {roleStats.permissionUsage.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Orphaned Users
                  </Typography>
                  <Typography variant="h4" color={roleStats.orphanedUsers > 0 ? 'error' : 'inherit'}>
                    {roleStats.orphanedUsers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Duplicate Permissions
                  </Typography>
                  <Typography variant="h4" color={roleStats.duplicatePermissions.length > 0 ? 'warning' : 'inherit'}>
                    {roleStats.duplicatePermissions.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Paper sx={{ width: '100%' }}>
          {viewMode === 'grid' ? (
            <DataGrid
              rows={roleTemplates || []}
              columns={columns}
              loading={isLoading}
              pageSizeOptions={[10, 25, 50]}
              checkboxSelection
              onRowSelectionModelChange={(newSelection: GridRowSelectionModel) => {
                setSelectedRoles(newSelection as string[]);
              }}
              rowSelectionModel={selectedRoles}
              autoHeight
            />
          ) : (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Role Hierarchy
              </Typography>
              {renderRoleHierarchy()}
            </Box>
          )}
        </Paper>
      </motion.div>

      {/* Create Role Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Role Template</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Role Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Parent Role (Optional)</InputLabel>
              <Select
                value={formData.parentRoleId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, parentRoleId: e.target.value || undefined }))}
              >
                <MenuItem value="">None</MenuItem>
                {roleTemplates?.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name} (Level {role.level})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                />
              }
              label="Set as default role template"
            />
            <Typography variant="h6" gutterBottom>
              Permissions
            </Typography>
            {renderPermissionGroups()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateRole}
            variant="contained"
            disabled={!formData.name || createRoleMutation.isPending}
          >
            Create Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Role Template</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Role Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Parent Role (Optional)</InputLabel>
              <Select
                value={formData.parentRoleId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, parentRoleId: e.target.value || undefined }))}
              >
                <MenuItem value="">None</MenuItem>
                {roleTemplates?.filter(role => role.id !== selectedRole?.id).map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name} (Level {role.level})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                />
              }
              label="Set as default role template"
            />
            <Typography variant="h6" gutterBottom>
              Permissions
            </Typography>
            {renderPermissionGroups()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateRole}
            variant="contained"
            disabled={!formData.name || updateRoleMutation.isPending}
          >
            Update Role
          </Button>
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

export default RoleTemplateManager;