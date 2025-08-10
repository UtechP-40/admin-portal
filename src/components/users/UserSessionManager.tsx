import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Block as BlockIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementApi } from '../../services/userManagementApi';

interface UserSessionManagerProps {
  userId?: string;
  showAllUsers?: boolean;
}

interface UserSession {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  location: {
    country: string;
    city: string;
    region: string;
  };
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
  isSuspicious: boolean;
  sessionDuration: number;
}

const UserSessionManager: React.FC<UserSessionManagerProps> = ({
  userId,
  showAllUsers = false
}) => {
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [bulkAction, setBulkAction] = useState('');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [filterBy, setFilterBy] = useState('all');

  const queryClient = useQueryClient();

  // Fetch user sessions
  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['userSessions', userId, filterBy],
    queryFn: () => userManagementApi.getUserSessions(
      showAllUsers ? undefined : userId,
      { filter: filterBy }
    ),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch session statistics
  const { data: sessionStats } = useQuery({
    queryKey: ['sessionStatistics', userId],
    queryFn: () => userManagementApi.getSessionStatistics(
      showAllUsers ? undefined : userId
    ),
    refetchInterval: 60000 // Refresh every minute
  });

  // Terminate session mutation
  const terminateSessionMutation = useMutation({
    mutationFn: (sessionId: string) => userManagementApi.terminateSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessionStatistics'] });
      setTerminateDialogOpen(false);
      setSelectedSession(null);
    }
  });

  // Bulk terminate sessions mutation
  const bulkTerminateSessionsMutation = useMutation({
    mutationFn: (sessionIds: string[]) => userManagementApi.bulkTerminateSessions(sessionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessionStatistics'] });
      setSelectedSessions([]);
    }
  });

  // Block suspicious sessions mutation
  const blockSuspiciousSessionsMutation = useMutation({
    mutationFn: () => userManagementApi.blockSuspiciousSessions(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessionStatistics'] });
    }
  });

  const handleTerminateSession = (session: UserSession) => {
    setSelectedSession(session);
    setTerminateDialogOpen(true);
  };

  const confirmTerminateSession = () => {
    if (selectedSession) {
      terminateSessionMutation.mutate(selectedSession.id);
    }
  };

  const handleBulkAction = () => {
    if (bulkAction === 'terminate' && selectedSessions.length > 0) {
      bulkTerminateSessionsMutation.mutate(selectedSessions);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <SmartphoneIcon />;
      case 'tablet':
        return <TabletIcon />;
      default:
        return <ComputerIcon />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const suspiciousSessions = sessions?.filter((session: UserSession) => session.isSuspicious) || [];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon />
          Session Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
            >
              <MenuItem value="all">All Sessions</MenuItem>
              <MenuItem value="active">Active Only</MenuItem>
              <MenuItem value="suspicious">Suspicious</MenuItem>
              <MenuItem value="mobile">Mobile Devices</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Session Statistics */}
      {sessionStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Sessions
                </Typography>
                <Typography variant="h4">
                  {sessionStats.activeSessions}
                </Typography>
                <Typography variant="body2" color="success.main">
                  Currently online
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Suspicious Sessions
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {sessionStats.suspiciousSessions}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Require attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Session Duration
                </Typography>
                <Typography variant="h4">
                  {formatDuration(sessionStats.avgSessionDuration)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Per session
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Mobile Sessions
                </Typography>
                <Typography variant="h4">
                  {sessionStats.mobileSessions}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {Math.round((sessionStats.mobileSessions / sessionStats.totalSessions) * 100)}% of total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Suspicious Sessions Alert */}
      {suspiciousSessions.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => blockSuspiciousSessionsMutation.mutate()}
              disabled={blockSuspiciousSessionsMutation.isPending}
            >
              Block All Suspicious
            </Button>
          }
        >
          {suspiciousSessions.length} suspicious session(s) detected. Review and take action if necessary.
        </Alert>
      )}

      {/* Bulk Actions */}
      {selectedSessions.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              {selectedSessions.length} session(s) selected
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Bulk Action</InputLabel>
              <Select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
              >
                <MenuItem value="terminate">Terminate Sessions</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              size="small"
              onClick={handleBulkAction}
              disabled={!bulkAction || bulkTerminateSessionsMutation.isPending}
            >
              Apply
            </Button>
            <Button
              size="small"
              onClick={() => setSelectedSessions([])}
            >
              Clear Selection
            </Button>
          </Box>
        </Box>
      )}

      {/* Sessions Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSessions(sessions?.map((s: UserSession) => s.id) || []);
                      } else {
                        setSelectedSessions([]);
                      }
                    }}
                    checked={selectedSessions.length === sessions?.length && sessions?.length > 0}
                  />
                </TableCell>
                <TableCell>User</TableCell>
                <TableCell>Device</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Login Time</TableCell>
                <TableCell>Last Activity</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions?.map((session: UserSession) => (
                <TableRow key={session.id}>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedSessions.includes(session.id)}
                      onChange={() => handleSessionSelect(session.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {session.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {session.username}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" fontFamily="monospace">
                          {session.ipAddress}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getDeviceIcon(session.deviceType)}
                      <Box>
                        <Typography variant="body2">
                          {session.browser}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {session.os}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2">
                          {session.location.city}, {session.location.country}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {session.location.region}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(session.loginTime).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTimeAgo(session.lastActivity)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDuration(session.sessionDuration)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={session.isActive ? 'Active' : 'Inactive'}
                        color={session.isActive ? 'success' : 'default'}
                        size="small"
                      />
                      {session.isSuspicious && (
                        <Chip
                          label="Suspicious"
                          color="warning"
                          size="small"
                          icon={<WarningIcon />}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Terminate Session">
                      <IconButton
                        size="small"
                        onClick={() => handleTerminateSession(session)}
                        color="error"
                      >
                        <BlockIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!sessions?.length && !isLoading && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="textSecondary">
                      No sessions found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Terminate Session Dialog */}
      <Dialog open={terminateDialogOpen} onClose={() => setTerminateDialogOpen(false)}>
        <DialogTitle>Terminate Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to terminate the session for user "{selectedSession?.username}"?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            The user will be logged out immediately and will need to log in again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTerminateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmTerminateSession}
            color="error"
            variant="contained"
            disabled={terminateSessionMutation.isPending}
          >
            {terminateSessionMutation.isPending ? 'Terminating...' : 'Terminate Session'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserSessionManager;