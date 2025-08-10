import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DatePicker,
  Alert,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { userManagementApi } from '../../services/userManagementApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface UserActivityMonitorProps {
  userId?: string;
  showAllUsers?: boolean;
}

interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

interface UserSession {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
  location?: string;
}

const UserActivityMonitor: React.FC<UserActivityMonitorProps> = ({
  userId,
  showAllUsers = false
}) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [activityFilter, setActivityFilter] = useState('all');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch user activity logs
  const { data: activityLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['userActivityLogs', userId, timeRange, activityFilter],
    queryFn: () => userManagementApi.getUserActivityLogs({
      userId: showAllUsers ? undefined : userId,
      timeRange,
      activityType: activityFilter === 'all' ? undefined : activityFilter
    }),
    refetchInterval
  });

  // Fetch active user sessions
  const { data: activeSessions, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['userSessions', userId],
    queryFn: () => userManagementApi.getUserSessions(showAllUsers ? undefined : userId),
    refetchInterval
  });

  // Fetch user activity statistics
  const { data: activityStats, isLoading: statsLoading } = useQuery({
    queryKey: ['userActivityStats', userId, timeRange],
    queryFn: () => userManagementApi.getUserActivityStats({
      userId: showAllUsers ? undefined : userId,
      timeRange
    }),
    refetchInterval: 60000 // 1 minute
  });

  const handleRefresh = () => {
    refetchLogs();
    refetchSessions();
  };

  const getActivityIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <LoginIcon color="success" />;
      case 'logout':
        return <LogoutIcon color="action" />;
      case 'create':
      case 'edit':
        return <EditIcon color="primary" />;
      case 'delete':
        return <DeleteIcon color="error" />;
      case 'security':
        return <SecurityIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
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

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon />
          User Activity Monitor
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Activity Type</InputLabel>
            <Select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
            >
              <MenuItem value="all">All Activities</MenuItem>
              <MenuItem value="login">Login/Logout</MenuItem>
              <MenuItem value="security">Security Events</MenuItem>
              <MenuItem value="admin">Admin Actions</MenuItem>
              <MenuItem value="errors">Errors</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Activity Statistics */}
      {activityStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Activities
                </Typography>
                <Typography variant="h4">
                  {activityStats.totalActivities}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {timeRange} period
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Sessions
                </Typography>
                <Typography variant="h4">
                  {activeSessions?.length || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Currently online
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Security Events
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {activityStats.securityEvents}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Requires attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Error Rate
                </Typography>
                <Typography variant="h4" color="error.main">
                  {activityStats.errorRate}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Of total activities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Activity Timeline Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Activity Timeline
            </Typography>
            {activityStats?.timeline && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityStats.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="activities" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="errors" stroke="#ff7300" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Active Sessions */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Sessions ({activeSessions?.length || 0})
            </Typography>
            {sessionsLoading && <LinearProgress />}
            <List>
              {activeSessions?.slice(0, 5).map((session: UserSession) => (
                <React.Fragment key={session.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={session.username}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {session.ipAddress} • {session.location || 'Unknown location'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Active: {formatTimeAgo(session.lastActivity)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label="Online"
                      color="success"
                      size="small"
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
              {!activeSessions?.length && !sessionsLoading && (
                <ListItem>
                  <ListItemText primary="No active sessions" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activity Logs */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity Logs
            </Typography>
            {logsLoading && <LinearProgress />}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activityLogs?.logs?.slice(0, 20).map((log: ActivityLog) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {formatTimeAgo(log.timestamp)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          {log.username}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getActivityIcon(log.action)}
                          {log.action}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                          {log.details}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {log.ipAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.severity}
                          color={getSeverityColor(log.severity) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!activityLogs?.logs?.length && !logsLoading && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">
                          No activity logs found for the selected period
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserActivityMonitor;