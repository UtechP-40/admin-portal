import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Menu,
  MenuItem as MenuItemComponent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  ImportExport as ImportExportIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { userManagementApi } from '../services/api';
import {
  UserCreationDialog,
  BulkUserOperations,
  UserActivityMonitor,
  UserSessionManager,
  EmailVerificationDialog,
  UserImportExport,
  GameUserManagement,
  RoleTemplateManager,
  RoleAssignmentDialog,
  RoleHierarchyViewer
} from '../components/users';

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
  const [bulkOperationsOpen, setBulkOperationsOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [emailVerificationOpen, setEmailVerificationOpen] = useState(false);
  const [activityMonitorOpen, setActivityMonitorOpen] = useState(false);
  const [sessionManagerOpen, setSessionManagerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState<null | HTMLElement>(null);
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
      width: 180,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EmailIcon />}
          label="Email Verification"
          onClick={() => {
            setSelectedUser(params.row);
            setEmailVerificationOpen(true);
          }}
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => {
            setSelectedUser(params.row);
            // For now, we'll use a simple edit - could be enhanced later
            const newStatus = prompt('Enter new status (pending, approved, suspended, rejected):', params.row.status);
            if (newStatus && ['pending', 'approved', 'suspended', 'rejected'].includes(newStatus)) {
              updateUserMutation.mutate({ id: params.row.id, data: { status: newStatus } });
            }
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
              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedUsers.length > 0 && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<GroupIcon />}
                      onClick={() => setBulkOperationsOpen(true)}
                    >
                      Bulk Actions ({selectedUsers.length})
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ImportExportIcon />}
                      onClick={() => setImportExportOpen(true)}
                    >
                      Export Selected
                    </Button>
                  </>
                )}
                <IconButton
                  onClick={(e) => setActionsMenuAnchor(e.currentTarget)}
                >
                  <MoreVertIcon />
                </IconButton>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateUserOpen(true)}
                >
                  Create Admin User
                </Button>
              </Box>
            </Box>
            <DataGrid
              rows={adminUsers?.users || []}
              columns={adminUserColumns}
              loading={adminUsersLoading}
              pageSizeOptions={[10, 25, 50]}
              checkboxSelection
              onRowSelectionModelChange={(newSelection: GridRowSelectionModel) => {
                setSelectedUsers(newSelection as string[]);
              }}
              rowSelectionModel={selectedUsers}
              autoHeight
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <GameUserManagement />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <RoleTemplateManager />
          </TabPanel>
        </Paper>
      </motion.div>

      {/* Enhanced User Creation Dialog */}
      <UserCreationDialog
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        roleTemplates={roleTemplates || []}
      />

      {/* Bulk User Operations Dialog */}
      <BulkUserOperations
        open={bulkOperationsOpen}
        onClose={() => setBulkOperationsOpen(false)}
        selectedUsers={selectedUsers}
        roleTemplates={roleTemplates || []}
      />

      {/* Import/Export Dialog */}
      <UserImportExport
        open={importExportOpen}
        onClose={() => setImportExportOpen(false)}
        selectedUsers={selectedUsers}
        roleTemplates={roleTemplates || []}
      />

      {/* Email Verification Dialog */}
      {selectedUser && (
        <EmailVerificationDialog
          open={emailVerificationOpen}
          onClose={() => setEmailVerificationOpen(false)}
          userId={selectedUser.id}
          userEmail={selectedUser.email}
          username={selectedUser.username}
        />
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={actionsMenuAnchor}
        open={Boolean(actionsMenuAnchor)}
        onClose={() => setActionsMenuAnchor(null)}
      >
        <MenuItemComponent
          onClick={() => {
            setImportExportOpen(true);
            setActionsMenuAnchor(null);
          }}
        >
          <ImportExportIcon sx={{ mr: 1 }} />
          Import/Export Users
        </MenuItemComponent>
        <MenuItemComponent
          onClick={() => {
            setActivityMonitorOpen(true);
            setActionsMenuAnchor(null);
          }}
        >
          <TimelineIcon sx={{ mr: 1 }} />
          Activity Monitor
        </MenuItemComponent>
        <MenuItemComponent
          onClick={() => {
            setSessionManagerOpen(true);
            setActionsMenuAnchor(null);
          }}
        >
          <SecurityIcon sx={{ mr: 1 }} />
          Session Manager
        </MenuItemComponent>
      </Menu>

      {/* Activity Monitor Dialog */}
      {activityMonitorOpen && (
        <Dialog
          open={activityMonitorOpen}
          onClose={() => setActivityMonitorOpen(false)}
          maxWidth="xl"
          fullWidth
        >
          <DialogTitle>User Activity Monitor</DialogTitle>
          <DialogContent>
            <UserActivityMonitor showAllUsers={true} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActivityMonitorOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Session Manager Dialog */}
      {sessionManagerOpen && (
        <Dialog
          open={sessionManagerOpen}
          onClose={() => setSessionManagerOpen(false)}
          maxWidth="xl"
          fullWidth
        >
          <DialogTitle>User Session Manager</DialogTitle>
          <DialogContent>
            <UserSessionManager showAllUsers={true} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSessionManagerOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

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



export default UserManagementPage;