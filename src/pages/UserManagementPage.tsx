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
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { userManagementApi } from '../services/api';

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
      id={`user-management-tabpanel-${index}`}
      aria-labelledby={`user-management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const UserManagementPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const queryClient = useQueryClient();

  // Fetch admin users
  const { data: adminUsers, isLoading: adminUsersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => userManagementApi.getAdminUsers()
  });

  // Fetch game users
  const { data: gameUsers, isLoading: gameUsersLoading } = useQuery({
    queryKey: ['gameUsers'],
    queryFn: () => userManagementApi.getGameUsers()
  });

  // Fetch user statistics
  const { data: userStats } = useQuery({
    queryKey: ['userStatistics'],
    queryFn: () => userManagementApi.getUserStatistics()
  });

  // Fetch role templates
  const { data: roleTemplates } = useQuery({
    queryKey: ['roleTemplates'],
    queryFn: () => userManagementApi.getRoleTemplates()
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: userManagementApi.createAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      setCreateUserOpen(false);
      setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to create user', severity: 'error' });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userManagementApi.updateAdminUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setEditUserOpen(false);
      setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to update user', severity: 'error' });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: userManagementApi.deleteAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to delete user', severity: 'error' });
    }
  });

  // Ban game user mutation
  const banGameUserMutation = useMutation({
    mutationFn: ({ id, reason, duration }: { id: string; reason: string; duration?: number }) =>
      userManagementApi.banGameUser(id, reason, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameUsers'] });
      setSnackbar({ open: true, message: 'User banned successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to ban user', severity: 'error' });
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateUser = (userData: any) => {
    createUserMutation.mutate(userData);
  };

  const handleUpdateUser = (userData: any) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data: userData });
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleBanGameUser = (userId: string, reason: string, duration?: number) => {
    banGameUserMutation.mutate({ id: userId, reason, duration });
  };

  // Admin users columns
  const adminUserColumns: GridColDef[] = [
    { field: 'username', headerName: 'Username', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'fullName', headerName: 'Full Name', width: 180 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'approved' ? 'success' : params.value === 'pending' ? 'warning' : 'error'}
          size="small"
        />
      )
    },
    {
      field: 'permissions',
      headerName: 'Permissions',
      width: 200,
      renderCell: (params) => (
        <Box>
          {params.value?.slice(0, 2).map((permission: string) => (
            <Chip key={permission} label={permission} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
          ))}
          {params.value?.length > 2 && (
            <Chip label={`+${params.value.length - 2} more`} size="small" variant="outlined" />
          )}
        </Box>
      )
    },
    {
      field: 'lastLogin',
      headerName: 'Last Login',
      width: 150,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'Never'
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
            setSelectedUser(params.row);
            setEditUserOpen(true);
          }}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteUser(params.row.id)}
        />
      ]
    }
  ];

  // Game users columns
  const gameUserColumns: GridColDef[] = [
    { field: 'username', headerName: 'Username', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'isBanned',
      headerName: 'Banned',
      width: 100,
      renderCell: (params) => params.value ? <BlockIcon color="error" /> : <CheckCircleIcon color="success" />
    },
    { field: 'gamesPlayed', headerName: 'Games Played', width: 120 },
    { field: 'winRate', headerName: 'Win Rate', width: 100, renderCell: (params) => `${params.value || 0}%` },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<BlockIcon />}
          label={params.row.isBanned ? "Unban" : "Ban"}
          onClick={() => {
            if (params.row.isBanned) {
              // Unban logic would go here
            } else {
              const reason = prompt('Enter ban reason:');
              if (reason) {
                handleBanGameUser(params.row.id, reason);
              }
            }
          }}
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
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          User Management
        </Typography>

        {/* Statistics Cards */}
        {userStats && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Admin Users
                  </Typography>
                  <Typography variant="h4">
                    {userStats.totalUsers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Users
                  </Typography>
                  <Typography variant="h4">
                    {userStats.activeUsers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Recent Logins
                  </Typography>
                  <Typography variant="h4">
                    {userStats.recentLogins}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Approvals
                  </Typography>
                  <Typography variant="h4">
                    {userStats.usersByStatus?.pending || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab
                label="Admin Users"
                icon={<AdminIcon />}
                iconPosition="start"
              />
              <Tab
                label="Game Users"
                icon={<PersonIcon />}
                iconPosition="start"
              />
              <Tab
                label="Role Templates"
                icon={<SecurityIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Admin Users</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateUserOpen(true)}
              >
                Create Admin User
              </Button>
            </Box>
            <DataGrid
              rows={adminUsers?.users || []}
              columns={adminUserColumns}
              loading={adminUsersLoading}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              autoHeight
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Game Users</Typography>
            </Box>
            <DataGrid
              rows={gameUsers?.users || []}
              columns={gameUserColumns}
              loading={gameUsersLoading}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              autoHeight
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Role Templates</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {/* Create role template logic */}}
              >
                Create Role Template
              </Button>
            </Box>
            <Grid container spacing={2}>
              {roleTemplates?.map((template: any) => (
                <Grid item xs={12} md={6} lg={4} key={template.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {template.description}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {template.permissions.slice(0, 3).map((permission: string) => (
                          <Chip
                            key={permission}
                            label={permission}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                        {template.permissions.length > 3 && (
                          <Chip
                            label={`+${template.permissions.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Chip
                          label={template.isDefault ? 'Default' : 'Custom'}
                          color={template.isDefault ? 'primary' : 'default'}
                          size="small"
                        />
                        <Box>
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                          {!template.isDefault && (
                            <IconButton size="small">
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>
        </Paper>
      </motion.div>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        onSubmit={handleCreateUser}
        roleTemplates={roleTemplates || []}
        loading={createUserMutation.isPending}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={editUserOpen}
        onClose={() => setEditUserOpen(false)}
        onSubmit={handleUpdateUser}
        user={selectedUser}
        roleTemplates={roleTemplates || []}
        loading={updateUserMutation.isPending}
      />

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

// Create User Dialog Component
const CreateUserDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  roleTemplates: any[];
  loading: boolean;
}> = ({ open, onClose, onSubmit, roleTemplates, loading }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    permissions: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleRoleTemplateSelect = (templateId: string) => {
    const template = roleTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData({ ...formData, permissions: template.permissions });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create Admin User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role Template (Optional)</InputLabel>
                <Select
                  value=""
                  onChange={(e) => handleRoleTemplateSelect(e.target.value)}
                >
                  {roleTemplates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Selected Permissions: {formData.permissions.length}
              </Typography>
              <Box sx={{ mt: 1 }}>
                {formData.permissions.map((permission: string) => (
                  <Chip
                    key={permission}
                    label={permission}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                    onDelete={() => {
                      setFormData({
                        ...formData,
                        permissions: formData.permissions.filter(p => p !== permission)
                      });
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Edit User Dialog Component
const EditUserDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  user: any;
  roleTemplates: any[];
  loading: boolean;
}> = ({ open, onClose, onSubmit, user, roleTemplates, loading }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    permissions: [],
    status: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        permissions: user.permissions || [],
        status: user.status || ''
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Admin User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Permissions: {formData.permissions.length}
              </Typography>
              <Box sx={{ mt: 1 }}>
                {formData.permissions.map((permission: string) => (
                  <Chip
                    key={permission}
                    label={permission}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                    onDelete={() => {
                      setFormData({
                        ...formData,
                        permissions: formData.permissions.filter(p => p !== permission)
                      });
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Updating...' : 'Update User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserManagementPage;