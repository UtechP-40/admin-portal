import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
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
  Alert,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stack,
  CircularProgress,
  Badge,
  Avatar,
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid/models';
import {
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  Timer as TimerIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { accessControlService } from '../../services/accessControlService';
import type { UserSession, SessionSettings, SessionSecurityLevel } from '../../types/accessControl';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission } from '../../types/permissions';

interface SessionDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  session: UserSession | null;
}

const SessionDetailsDialog: React.FC<SessionDetailsDialogProps> = ({ open, onClose, session }) => {
  if (!session) return null;

  const getDeviceIcon = (deviceInfo: UserSession['deviceInfo']) => {
    if (deviceInfo.isMobile) {
      return <SmartphoneIcon />;
    } else if (deviceInfo.device.toLowerCase().includes('tablet')) {
      return <TabletIcon />;
    } else {
      return <ComputerIcon />;
    }
  };

  const getSecurityLevelColor = (level: SessionSecurityLevel) => {
    switch (level) {
      case SessionSecurityLevel.MAXIMUM:
        return 'success';
      case SessionSecurityLevel.HIGH:
        return 'info';
      case SessionSecurityLevel.STANDARD:
        return 'warning';
      case SessionSecurityLevel.BASIC:
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getDeviceIcon(session.deviceInfo)}
          Session Details - {session.username}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Session ID
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {session.id}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip
                        size="small"
                        label={session.isActive ? 'Active' : 'Inactive'}
                        color={session.isActive ? 'success' : 'default'}
                        icon={session.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                      />
                      {session.isCurrent && (
                        <Chip size="small" label="Current" color="primary" />
                      )}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Security Level
                    </Typography>
                    <Chip
                      size="small"
                      label={session.securityLevel.toUpperCase()}
                      color={getSecurityLevelColor(session.securityLevel) as any}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      MFA Verified
                    </Typography>
                    <Chip
                      size="small"
                      label={session.mfaVerified ? 'Yes' : 'No'}
                      color={session.mfaVerified ? 'success' : 'warning'}
                      icon={session.mfaVerified ? <CheckCircleIcon /> : <WarningIcon />}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Device Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Device Type
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getDeviceIcon(session.deviceInfo)}
                      <Typography variant="body2">
                        {session.deviceInfo.device} ({session.deviceInfo.isMobile ? 'Mobile' : 'Desktop'})
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Browser
                    </Typography>
                    <Typography variant="body2">{session.deviceInfo.browser}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Operating System
                    </Typography>
                    <Typography variant="body2">{session.deviceInfo.os}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      User Agent
                    </Typography>
                    <Typography variant="body2" fontSize="0.75rem" sx={{ wordBreak: 'break-all' }}>
                      {session.userAgent}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Network Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      IP Address
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {session.ipAddress}
                    </Typography>
                  </Box>
                  {session.location && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Location
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" />
                        <Typography variant="body2">
                          {session.location.city}, {session.location.region}, {session.location.country}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Timing Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(session.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Last Activity
                    </Typography>
                    <Typography variant="body2">
                      {formatDistanceToNow(new Date(session.lastActivityAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Expires
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(session.expiresAt), 'MMM dd, yyyy HH:mm:ss')}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {session.metadata && Object.keys(session.metadata).length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Additional Metadata
                  </Typography>
                  <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>
                    {JSON.stringify(session.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const SessionManagementPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch session settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['session-settings'],
    queryFn: accessControlService.getSessionSettings,
  });

  // Fetch user sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: () => accessControlService.getUserSessions(),
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if enabled
  });

  // Fetch active sessions count
  const { data: activeSessionsCount } = useQuery({
    queryKey: ['active-sessions-count'],
    queryFn: accessControlService.getActiveSessionsCount,
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds if enabled
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: accessControlService.updateSessionSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-settings'] });
    },
  });

  // Terminate session mutation
  const terminateSessionMutation = useMutation({
    mutationFn: accessControlService.terminateSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['active-sessions-count'] });
    },
  });

  // Terminate user sessions mutation
  const terminateUserSessionsMutation = useMutation({
    mutationFn: ({ userId, excludeCurrentSession }: { userId: string; excludeCurrentSession?: boolean }) =>
      accessControlService.terminateUserSessions(userId, excludeCurrentSession),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['active-sessions-count'] });
    },
  });

  // Extend session mutation
  const extendSessionMutation = useMutation({
    mutationFn: ({ sessionId, minutes }: { sessionId: string; minutes: number }) =>
      accessControlService.extendSession(sessionId, minutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
  });

  const handleTerminateSession = (sessionId: string) => {
    if (window.confirm('Are you sure you want to terminate this session?')) {
      terminateSessionMutation.mutate(sessionId);
    }
  };

  const handleTerminateUserSessions = (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to terminate all sessions for ${username}?`)) {
      terminateUserSessionsMutation.mutate({ userId, excludeCurrentSession: true });
    }
  };

  const handleExtendSession = (sessionId: string) => {
    const minutes = window.prompt('Extend session by how many minutes?', '60');
    if (minutes && !isNaN(Number(minutes))) {
      extendSessionMutation.mutate({ sessionId, minutes: Number(minutes) });
    }
  };

  const handleViewDetails = (session: UserSession) => {
    setSelectedSession(session);
    setDetailsDialogOpen(true);
  };

  const getDeviceIcon = (deviceInfo: UserSession['deviceInfo']) => {
    if (deviceInfo.isMobile) {
      return <SmartphoneIcon fontSize="small" />;
    } else if (deviceInfo.device.toLowerCase().includes('tablet')) {
      return <TabletIcon fontSize="small" />;
    } else {
      return <ComputerIcon fontSize="small" />;
    }
  };

  const getSecurityLevelColor = (level: SessionSecurityLevel) => {
    switch (level) {
      case SessionSecurityLevel.MAXIMUM:
        return 'success';
      case SessionSecurityLevel.HIGH:
        return 'info';
      case SessionSecurityLevel.STANDARD:
        return 'warning';
      case SessionSecurityLevel.BASIC:
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'username',
      headerName: 'User',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 24, height: 24 }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'deviceInfo',
      headerName: 'Device',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getDeviceIcon(params.value)}
          <Box>
            <Typography variant="body2" noWrap>
              {params.value.browser}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {params.value.os}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'ipAddress',
      headerName: 'IP Address',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontFamily="monospace">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 180,
      renderCell: (params) => (
        params.value ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon fontSize="small" />
            <Typography variant="body2" noWrap>
              {params.value.city}, {params.value.country}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Unknown
          </Typography>
        )
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Chip
            size="small"
            label={params.value ? 'Active' : 'Inactive'}
            color={params.value ? 'success' : 'default'}
            icon={params.value ? <CheckCircleIcon /> : <CancelIcon />}
          />
          {params.row.isCurrent && (
            <Chip size="small" label="Current" color="primary" />
          )}
        </Box>
      ),
    },
    {
      field: 'securityLevel',
      headerName: 'Security',
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value.toUpperCase()}
          color={getSecurityLevelColor(params.value) as any}
        />
      ),
    },
    {
      field: 'mfaVerified',
      headerName: 'MFA',
      width: 80,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'warning'}
          icon={params.value ? <CheckCircleIcon /> : <WarningIcon />}
        />
      ),
    },
    {
      field: 'lastActivityAt',
      headerName: 'Last Activity',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {formatDistanceToNow(new Date(params.value), { addSuffix: true })}
        </Typography>
      ),
    },
    {
      field: 'expiresAt',
      headerName: 'Expires',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {formatDistanceToNow(new Date(params.value), { addSuffix: true })}
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
          key="view"
          icon={<VisibilityIcon />}
          label="View Details"
          onClick={() => handleViewDetails(params.row)}
        />,
        <GridActionsCellItem
          key="extend"
          icon={<ScheduleIcon />}
          label="Extend Session"
          onClick={() => handleExtendSession(params.row.id)}
          disabled={!hasPermission(Permission.MANAGE_USERS) || !params.row.isActive}
        />,
        <GridActionsCellItem
          key="terminate"
          icon={<BlockIcon />}
          label="Terminate"
          onClick={() => handleTerminateSession(params.row.id)}
          disabled={!hasPermission(Permission.MANAGE_USERS) || params.row.isCurrent}
        />,
      ],
    },
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
      <GridToolbarExport />
      <Box sx={{ flexGrow: 1 }} />
      <FormControlLabel
        control={
          <Switch
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            size="small"
          />
        }
        label="Auto Refresh"
        sx={{ mr: 2 }}
      />
      <Button
        startIcon={<RefreshIcon />}
        onClick={() => {
          queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
          queryClient.invalidateQueries({ queryKey: ['active-sessions-count'] });
        }}
      >
        Refresh
      </Button>
    </GridToolbarContainer>
  );

  if (settingsLoading || sessionsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Session Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Session Statistics */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {activeSessionsCount || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Sessions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {sessionsData?.sessions?.filter(s => s.mfaVerified).length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      MFA Verified
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {new Set(sessionsData?.sessions?.map(s => s.userId)).size || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unique Users
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {sessionsData?.sessions?.filter(s => s.deviceInfo.isMobile).length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mobile Sessions
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Session Settings */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">Session Settings</Typography>
              </Box>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Max Concurrent Sessions
                  </Typography>
                  <Typography variant="h6">
                    {settings?.maxConcurrentSessions || 'Unlimited'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Session Timeout
                  </Typography>
                  <Typography variant="h6">
                    {settings?.sessionTimeout || 0} minutes
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Idle Timeout
                  </Typography>
                  <Typography variant="h6">
                    {settings?.idleTimeout || 0} minutes
                  </Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.deviceTracking?.enabled || false}
                      disabled
                    />
                  }
                  label="Device Tracking"
                />

                <Button
                  startIcon={<SettingsIcon />}
                  size="small"
                  onClick={() => setSettingsDialogOpen(true)}
                  disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG)}
                >
                  Configure Settings
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Sessions Table */}
        <Grid item xs={12}>
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={sessionsData?.sessions || []}
              columns={columns}
              slots={{
                toolbar: CustomToolbar,
              }}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
                sorting: {
                  sortModel: [{ field: 'lastActivityAt', sort: 'desc' }],
                },
              }}
              pageSizeOptions={[25, 50, 100]}
              checkboxSelection
              disableRowSelectionOnClick
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Session Details Dialog */}
      <SessionDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        session={selectedSession}
      />
    </Box>
  );
};

export default SessionManagementPanel;