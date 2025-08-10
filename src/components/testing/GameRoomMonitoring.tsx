import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Badge,
  Tooltip,
  Switch,
  FormControlLabel,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  People as PeopleIcon,
  Timer as TimerIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Replay as ReplayIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LiveTv as LiveTvIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { websocketService } from '../../services/websocketService';

interface GameRoom {
  id: string;
  code: string;
  name: string;
  hostId: string;
  hostName: string;
  players: GamePlayer[];
  status: 'waiting' | 'playing' | 'finished';
  gamePhase: 'day' | 'night' | 'voting' | 'results';
  settings: RoomSettings;
  createdAt: string;
  updatedAt: string;
  duration: number;
  maxPlayers: number;
  isPublic: boolean;
}

interface GamePlayer {
  id: string;
  username: string;
  role?: string;
  isAlive: boolean;
  isHost: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastActivity: string;
  statistics: PlayerStatistics;
}

interface PlayerStatistics {
  actionsPerformed: number;
  messagessent: number;
  votesReceived: number;
  suspiciousActivity: number;
}

interface RoomSettings {
  maxPlayers: number;
  enableVoiceChat: boolean;
  dayPhaseDuration: number;
  nightPhaseDuration: number;
  votingDuration: number;
  isPublic: boolean;
}

interface RoomAnalytics {
  totalRooms: number;
  activeRooms: number;
  totalPlayers: number;
  averageRoomDuration: number;
  peakConcurrentRooms: number;
  roomsCreatedToday: number;
  averagePlayersPerRoom: number;
  popularGameModes: Array<{ mode: string; count: number }>;
}

interface SecurityAlert {
  id: string;
  roomId: string;
  playerId: string;
  type: 'suspicious_activity' | 'cheating_detected' | 'inappropriate_content' | 'connection_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  resolved: boolean;
}

interface PlayerAction {
  id: string;
  playerId: string;
  playerName: string;
  action: string;
  target?: string;
  timestamp: string;
  gamePhase: string;
  data?: any;
}

interface RoomPerformanceMetrics {
  roomId: string;
  averageResponseTime: number;
  messageLatency: number;
  connectionStability: number;
  memoryUsage: number;
  cpuUsage: number;
  networkThroughput: number;
  errorRate: number;
  playerSatisfaction: number;
  recommendations: string[];
}

interface LiveRoomState {
  roomId: string;
  currentPhase: string;
  phaseTimeRemaining: number;
  activeConnections: number;
  recentActions: PlayerAction[];
  performanceMetrics: RoomPerformanceMetrics;
  lastUpdated: string;
}

export function GameRoomMonitoring() {
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<GamePlayer | null>(null);
  const [showSecurityAlerts, setShowSecurityAlerts] = useState(false);
  const [showPerformanceTest, setShowPerformanceTest] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  
  // New state for enhanced monitoring
  const [showLiveMonitoring, setShowLiveMonitoring] = useState(false);
  const [showActionReplay, setShowActionReplay] = useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [liveRoomStates, setLiveRoomStates] = useState<Map<string, LiveRoomState>>(new Map());
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([]);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayPosition, setReplayPosition] = useState(0);
  const [detailsTabValue, setDetailsTabValue] = useState(0);

  const queryClient = useQueryClient();

  // Real-time WebSocket connection for live monitoring
  useEffect(() => {
    if (showLiveMonitoring && websocketService.connected) {
      // Subscribe to room updates
      const unsubscribeRooms = websocketService.on('rooms:update', (updatedRooms: GameRoom[]) => {
        queryClient.setQueryData(['game-rooms', filterStatus, sortBy], { data: updatedRooms });
      });

      // Subscribe to player actions
      const unsubscribeActions = websocketService.on('player:action', (action: PlayerAction) => {
        setPlayerActions(prev => [action, ...prev].slice(0, 100)); // Keep last 100 actions
      });

      // Subscribe to live room state updates
      const unsubscribeLiveState = websocketService.on('room:live-state', (liveState: LiveRoomState) => {
        setLiveRoomStates(prev => new Map(prev.set(liveState.roomId, liveState)));
      });

      // Request initial live monitoring data
      websocketService.send('admin:subscribe-room-monitoring', { 
        rooms: rooms?.data?.map((r: GameRoom) => r.id) || [] 
      });

      return () => {
        unsubscribeRooms();
        unsubscribeActions();
        unsubscribeLiveState();
        websocketService.send('admin:unsubscribe-room-monitoring');
      };
    }
  }, [showLiveMonitoring, rooms?.data, filterStatus, sortBy, queryClient]);

  // Action replay functionality
  useEffect(() => {
    let replayInterval: NodeJS.Timeout;
    
    if (isReplaying && roomActions?.data?.length) {
      replayInterval = setInterval(() => {
        setReplayPosition(prev => {
          const nextPosition = prev + 1;
          if (nextPosition >= roomActions.data.length) {
            setIsReplaying(false);
            return prev;
          }
          return nextPosition;
        });
      }, 1000 / replaySpeed);
    }

    return () => {
      if (replayInterval) {
        clearInterval(replayInterval);
      }
    };
  }, [isReplaying, replaySpeed, roomActions?.data?.length]);

  // Reset replay position when room changes
  useEffect(() => {
    setReplayPosition(0);
    setIsReplaying(false);
  }, [selectedRoom]);

  // Fetch player actions for replay
  const { data: roomActions } = useQuery({
    queryKey: ['room-actions', selectedRoom],
    queryFn: () => apiService.get(`/admin/game-rooms/${selectedRoom}/actions`),
    enabled: !!selectedRoom && showActionReplay,
  });

  // Fetch room performance metrics
  const { data: performanceMetrics } = useQuery({
    queryKey: ['room-performance', selectedRoom],
    queryFn: () => apiService.get(`/admin/game-rooms/${selectedRoom}/performance`),
    enabled: !!selectedRoom && showPerformanceMetrics,
    refetchInterval: 10000, // Update every 10 seconds
  });

  // Fetch active game rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['game-rooms', filterStatus, sortBy],
    queryFn: () => apiService.get('/admin/game-rooms', {
      params: { status: filterStatus, sortBy }
    }),
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch room analytics
  const { data: analytics } = useQuery({
    queryKey: ['room-analytics'],
    queryFn: () => apiService.get('/admin/game-rooms/analytics'),
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch security alerts
  const { data: securityAlerts } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: () => apiService.get('/admin/security/alerts'),
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch room details
  const { data: roomDetails } = useQuery({
    queryKey: ['room-details', selectedRoom],
    queryFn: () => apiService.get(`/admin/game-rooms/${selectedRoom}`),
    enabled: !!selectedRoom,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Mutations
  const endRoomMutation = useMutation({
    mutationFn: (roomId: string) => apiService.post(`/admin/game-rooms/${roomId}/end`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-rooms'] });
    },
  });

  const kickPlayerMutation = useMutation({
    mutationFn: ({ roomId, playerId }: { roomId: string; playerId: string }) =>
      apiService.post(`/admin/game-rooms/${roomId}/kick/${playerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-details'] });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) => apiService.post(`/admin/security/alerts/${alertId}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'warning';
      case 'playing': return 'success';
      case 'finished': return 'default';
      default: return 'default';
    }
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircleIcon color="success" />;
      case 'disconnected': return <ErrorIcon color="error" />;
      case 'reconnecting': return <WarningIcon color="warning" />;
      default: return <ErrorIcon color="disabled" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Analytics Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Room Analytics Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Rooms
                    </Typography>
                    <Typography variant="h4">
                      {analytics?.data?.totalRooms || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Active Rooms
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {analytics?.data?.activeRooms || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Players
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {analytics?.data?.totalPlayers || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Avg Duration
                    </Typography>
                    <Typography variant="h4">
                      {formatDuration(analytics?.data?.averageRoomDuration || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Controls */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Status Filter"
                  >
                    <MenuItem value="all">All Rooms</MenuItem>
                    <MenuItem value="waiting">Waiting</MenuItem>
                    <MenuItem value="playing">Playing</MenuItem>
                    <MenuItem value="finished">Finished</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                  >
                    <MenuItem value="createdAt">Created Date</MenuItem>
                    <MenuItem value="playerCount">Player Count</MenuItem>
                    <MenuItem value="duration">Duration</MenuItem>
                    <MenuItem value="activity">Last Activity</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                  }
                  label="Auto Refresh"
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={showLiveMonitoring ? 'contained' : 'outlined'}
                  startIcon={<LiveTvIcon />}
                  onClick={() => setShowLiveMonitoring(!showLiveMonitoring)}
                  color={showLiveMonitoring ? 'primary' : 'inherit'}
                >
                  Live Monitoring
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SecurityIcon />}
                  onClick={() => setShowSecurityAlerts(true)}
                  color={securityAlerts?.data?.filter((a: SecurityAlert) => !a.resolved).length > 0 ? 'error' : 'inherit'}
                >
                  Security Alerts
                  {securityAlerts?.data?.filter((a: SecurityAlert) => !a.resolved).length > 0 && (
                    <Badge
                      badgeContent={securityAlerts.data.filter((a: SecurityAlert) => !a.resolved).length}
                      color="error"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SpeedIcon />}
                  onClick={() => setShowPerformanceTest(true)}
                >
                  Performance Test
                </Button>
                <IconButton onClick={() => queryClient.invalidateQueries({ queryKey: ['game-rooms'] })}>
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Active Rooms List */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Active Game Rooms
            </Typography>

            {roomsLoading ? (
              <LinearProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Room Code</TableCell>
                      <TableCell>Host</TableCell>
                      <TableCell>Players</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Phase</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {rooms?.data?.map((room: GameRoom) => (
                        <motion.tr
                          key={room.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          component={TableRow}
                          hover
                        >
                          <TableCell>
                            <Typography variant="subtitle2">
                              {room.code}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {room.name || 'Unnamed Room'}
                            </Typography>
                          </TableCell>
                          <TableCell>{room.hostName}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PeopleIcon fontSize="small" />
                              <Typography>
                                {room.players.length}/{room.maxPlayers}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={room.status}
                              color={getStatusColor(room.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {room.status === 'playing' && (
                              <Chip
                                label={room.gamePhase}
                                variant="outlined"
                                size="small"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TimerIcon fontSize="small" />
                              <Typography variant="body2">
                                {formatDuration(room.duration)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedRoom(room.id);
                                    setShowRoomDetails(true);
                                  }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Action Replay">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedRoom(room.id);
                                    setShowActionReplay(true);
                                  }}
                                >
                                  <ReplayIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Performance Metrics">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedRoom(room.id);
                                    setShowPerformanceMetrics(true);
                                  }}
                                >
                                  <AssessmentIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="End Room">
                                <IconButton
                                  size="small"
                                  onClick={() => endRoomMutation.mutate(room.id)}
                                  disabled={room.status === 'finished'}
                                >
                                  <StopIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {rooms?.data?.length === 0 && (
              <Alert severity="info">
                No active game rooms found.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Room Details Dialog */}
      <Dialog open={showRoomDetails} onClose={() => setShowRoomDetails(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Room Details - {roomDetails?.data?.code}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {showLiveMonitoring && liveRoomStates.has(selectedRoom) && (
                <Chip 
                  icon={<LiveTvIcon />} 
                  label="LIVE" 
                  color="success" 
                  size="small" 
                  variant="outlined"
                />
              )}
              <Chip 
                label={roomDetails?.data?.status} 
                color={getStatusColor(roomDetails?.data?.status) as any} 
                size="small" 
              />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {roomDetails?.data && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Room Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Room Code" secondary={roomDetails.data.code} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Host" secondary={roomDetails.data.hostName} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Status" secondary={
                        <Chip label={roomDetails.data.status} color={getStatusColor(roomDetails.data.status) as any} size="small" />
                      } />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Duration" secondary={formatDuration(roomDetails.data.duration)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Created" secondary={new Date(roomDetails.data.createdAt).toLocaleString()} />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Game Settings
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Max Players" secondary={roomDetails.data.settings.maxPlayers} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Voice Chat" secondary={roomDetails.data.settings.enableVoiceChat ? 'Enabled' : 'Disabled'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Day Phase Duration" secondary={`${roomDetails.data.settings.dayPhaseDuration}s`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Night Phase Duration" secondary={`${roomDetails.data.settings.nightPhaseDuration}s`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Public Room" secondary={roomDetails.data.settings.isPublic ? 'Yes' : 'No'} />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Players ({roomDetails.data.players.length})
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Username</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Connection</TableCell>
                          <TableCell>Activity</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {roomDetails.data.players.map((player: GamePlayer) => (
                          <TableRow key={player.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {player.isHost && <Chip label="Host" size="small" color="primary" />}
                                {player.username}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {player.role && (
                                <Chip label={player.role} size="small" variant="outlined" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={player.isAlive ? 'Alive' : 'Eliminated'}
                                color={player.isAlive ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getConnectionStatusIcon(player.connectionStatus)}
                                <Typography variant="caption">
                                  {player.connectionStatus}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {new Date(player.lastActivity).toLocaleTimeString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setSelectedPlayer(player);
                                    setShowPlayerDetails(true);
                                  }}
                                >
                                  Details
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => kickPlayerMutation.mutate({
                                    roomId: roomDetails.data.id,
                                    playerId: player.id
                                  })}
                                  disabled={player.isHost}
                                >
                                  Kick
                                </Button>
                              </Box>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setSelectedPlayer(player);
                                    setShowPlayerDetails(true);
                                  }}
                                >
                                  Details
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => kickPlayerMutation.mutate({
                                    roomId: roomDetails.data.id,
                                    playerId: player.id
                                  })}
                                  disabled={player.isHost}
                                >
                                  Kick
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRoomDetails(false)}>Close</Button>
          <Button
            color="error"
            onClick={() => {
              if (roomDetails?.data?.id) {
                endRoomMutation.mutate(roomDetails.data.id);
                setShowRoomDetails(false);
              }
            }}
          >
            End Room
          </Button>
        </DialogActions>
      </Dialog>

      {/* Player Details Dialog */}
      <Dialog open={showPlayerDetails} onClose={() => setShowPlayerDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Player Details - {selectedPlayer?.username}
        </DialogTitle>
        <DialogContent>
          {selectedPlayer && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Player Statistics
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Actions Performed" secondary={selectedPlayer.statistics.actionsPerformed} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Messages Sent" secondary={selectedPlayer.statistics.messagesent} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Votes Received" secondary={selectedPlayer.statistics.votesReceived} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Suspicious Activity Score" secondary={
                    <Chip
                      label={selectedPlayer.statistics.suspiciousActivity}
                      color={selectedPlayer.statistics.suspiciousActivity > 5 ? 'error' : 'default'}
                      size="small"
                    />
                  } />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPlayerDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Security Alerts Dialog */}
      <Dialog open={showSecurityAlerts} onClose={() => setShowSecurityAlerts(false)} maxWidth="md" fullWidth>
        <DialogTitle>Security Alerts</DialogTitle>
        <DialogContent>
          <List>
            {securityAlerts?.data?.map((alert: SecurityAlert) => (
              <ListItem key={alert.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={alert.severity}
                        color={getSeverityColor(alert.severity) as any}
                        size="small"
                      />
                      <Chip
                        label={alert.type.replace('_', ' ')}
                        variant="outlined"
                        size="small"
                      />
                      {alert.resolved && <Chip label="Resolved" color="success" size="small" />}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2">{alert.description}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(alert.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  {!alert.resolved && (
                    <Button
                      size="small"
                      onClick={() => resolveAlertMutation.mutate(alert.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          {securityAlerts?.data?.length === 0 && (
            <Alert severity="success">No security alerts at this time.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSecurityAlerts(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Performance Test Dialog */}
      <Dialog open={showPerformanceTest} onClose={() => setShowPerformanceTest(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Room Performance Testing</DialogTitle>
        <DialogContent>
          <PerformanceTestForm />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPerformanceTest(false)}>Close</Button>
        </DialogActions>
      </Dialog>

function PerformanceTestForm() {
  const [testType, setTestType] = useState('load');
  const [simulatedPlayers, setSimulatedPlayers] = useState(10);
  const [testDuration, setTestDuration] = useState(60);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runPerformanceTest = async () => {
    setRunning(true);
    try {
      const response = await apiService.post('/admin/game-rooms/performance-test', {
        type: testType,
        simulatedPlayers,
        duration: testDuration,
      });
      setResults(response.data);
    } catch (error) {
      console.error('Performance test failed:', error);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Box sx={{ pt: 2 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Test Type</InputLabel>
        <Select
          value={testType}
          onChange={(e) => setTestType(e.target.value)}
          label="Test Type"
        >
          <MenuItem value="load">Load Test</MenuItem>
          <MenuItem value="stress">Stress Test</MenuItem>
          <MenuItem value="endurance">Endurance Test</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        type="number"
        label="Simulated Players"
        value={simulatedPlayers}
        onChange={(e) => setSimulatedPlayers(Number(e.target.value))}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        type="number"
        label="Test Duration (seconds)"
        value={testDuration}
        onChange={(e) => setTestDuration(Number(e.target.value))}
        sx={{ mb: 2 }}
      />

      <Button
        fullWidth
        variant="contained"
        onClick={runPerformanceTest}
        disabled={running}
        sx={{ mb: 2 }}
      >
        {running ? 'Running Test...' : 'Start Performance Test'}
      </Button>

      {results && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
} 
     {/* Action Replay Dialog */}
      <Dialog open={showActionReplay} onClose={() => setShowActionReplay(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Action Replay - Room {rooms?.data?.find((r: GameRoom) => r.id === selectedRoom)?.code}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Speed</InputLabel>
                <Select
                  value={replaySpeed}
                  onChange={(e) => setReplaySpeed(Number(e.target.value))}
                  label="Speed"
                >
                  <MenuItem value={0.5}>0.5x</MenuItem>
                  <MenuItem value={1}>1x</MenuItem>
                  <MenuItem value={2}>2x</MenuItem>
                  <MenuItem value={4}>4x</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant={isReplaying ? 'contained' : 'outlined'}
                startIcon={isReplaying ? <StopIcon /> : <PlayArrowIcon />}
                onClick={() => setIsReplaying(!isReplaying)}
                disabled={!roomActions?.data?.length}
              >
                {isReplaying ? 'Stop' : 'Play'}
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Replay Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(replayPosition / (roomActions?.data?.length || 1)) * 100}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              Action {replayPosition + 1} of {roomActions?.data?.length || 0}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Action Timeline
                </Typography>
                <Timeline>
                  {roomActions?.data?.slice(0, replayPosition + 1).map((action: PlayerAction, index: number) => (
                    <TimelineItem key={action.id}>
                      <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={index === replayPosition ? 'primary' : 'grey'}>
                          {action.action === 'vote' && <HistoryIcon />}
                          {action.action === 'message' && <HistoryIcon />}
                          {action.action === 'join' && <CheckCircleIcon />}
                          {action.action === 'leave' && <ErrorIcon />}
                        </TimelineDot>
                        {index < (roomActions?.data?.length || 0) - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: '12px', px: 2 }}>
                        <Typography variant="h6" component="span">
                          {action.playerName}
                        </Typography>
                        <Typography color="text.secondary">
                          {action.action} {action.target && `→ ${action.target}`}
                        </Typography>
                        <Chip label={action.gamePhase} size="small" sx={{ mt: 1 }} />
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Action Details
                </Typography>
                {roomActions?.data?.[replayPosition] && (
                  <Box>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Player" 
                          secondary={roomActions.data[replayPosition].playerName} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Action" 
                          secondary={roomActions.data[replayPosition].action} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Game Phase" 
                          secondary={roomActions.data[replayPosition].gamePhase} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Timestamp" 
                          secondary={new Date(roomActions.data[replayPosition].timestamp).toLocaleString()} 
                        />
                      </ListItem>
                      {roomActions.data[replayPosition].target && (
                        <ListItem>
                          <ListItemText 
                            primary="Target" 
                            secondary={roomActions.data[replayPosition].target} 
                          />
                        </ListItem>
                      )}
                    </List>
                    {roomActions.data[replayPosition].data && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Additional Data
                        </Typography>
                        <pre style={{ fontSize: '12px', overflow: 'auto', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                          {JSON.stringify(roomActions.data[replayPosition].data, null, 2)}
                        </pre>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowActionReplay(false)}>Close</Button>
          <Button 
            onClick={() => setReplayPosition(Math.max(0, replayPosition - 1))}
            disabled={replayPosition === 0}
          >
            Previous
          </Button>
          <Button 
            onClick={() => setReplayPosition(Math.min((roomActions?.data?.length || 1) - 1, replayPosition + 1))}
            disabled={replayPosition >= (roomActions?.data?.length || 1) - 1}
          >
            Next
          </Button>
        </DialogActions>
      </Dialog>

      {/* Performance Metrics Dialog */}
      <Dialog open={showPerformanceMetrics} onClose={() => setShowPerformanceMetrics(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Performance Metrics - Room {rooms?.data?.find((r: GameRoom) => r.id === selectedRoom)?.code}
        </DialogTitle>
        <DialogContent>
          <Tabs value={detailsTabValue} onChange={(e, newValue) => setDetailsTabValue(newValue)}>
            <Tab label="Real-time Metrics" />
            <Tab label="Performance Analysis" />
            <Tab label="Optimization Suggestions" />
          </Tabs>

          {detailsTabValue === 0 && (
            <Box sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            Response Time
                          </Typography>
                          <Typography variant="h5">
                            {performanceMetrics?.data?.averageResponseTime || 0}ms
                          </Typography>
                        </Box>
                        <TrendingUpIcon color="success" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            Message Latency
                          </Typography>
                          <Typography variant="h5">
                            {performanceMetrics?.data?.messageLatency || 0}ms
                          </Typography>
                        </Box>
                        <TrendingDownIcon color="error" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            Connection Stability
                          </Typography>
                          <Typography variant="h5">
                            {((performanceMetrics?.data?.connectionStability || 0) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                        <CheckCircleIcon color="success" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            Error Rate
                          </Typography>
                          <Typography variant="h5">
                            {((performanceMetrics?.data?.errorRate || 0) * 100).toFixed(2)}%
                          </Typography>
                        </Box>
                        <WarningIcon color="warning" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Resource Usage
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Memory Usage" 
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(performanceMetrics?.data?.memoryUsage || 0) * 100} 
                                sx={{ flexGrow: 1 }}
                              />
                              <Typography variant="body2">
                                {((performanceMetrics?.data?.memoryUsage || 0) * 100).toFixed(1)}%
                              </Typography>
                            </Box>
                          } 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="CPU Usage" 
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(performanceMetrics?.data?.cpuUsage || 0) * 100} 
                                sx={{ flexGrow: 1 }}
                              />
                              <Typography variant="body2">
                                {((performanceMetrics?.data?.cpuUsage || 0) * 100).toFixed(1)}%
                              </Typography>
                            </Box>
                          } 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Network Throughput" 
                          secondary={`${(performanceMetrics?.data?.networkThroughput || 0).toFixed(2)} MB/s`} 
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Player Satisfaction
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <CircularProgress 
                        variant="determinate" 
                        value={(performanceMetrics?.data?.playerSatisfaction || 0) * 100}
                        size={80}
                      />
                      <Box>
                        <Typography variant="h4">
                          {((performanceMetrics?.data?.playerSatisfaction || 0) * 100).toFixed(1)}%
                        </Typography>
                        <Typography color="text.secondary">
                          Overall Satisfaction
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Based on connection stability, response times, and player feedback
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {detailsTabValue === 1 && (
            <Box sx={{ pt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Performance Analysis
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Performance analysis is based on the last 24 hours of room activity
                  </Alert>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Response Time Trends
                    </Typography>
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color="text.secondary">
                        Chart visualization would be implemented here
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Connection Quality
                    </Typography>
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color="text.secondary">
                        Chart visualization would be implemented here
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {detailsTabValue === 2 && (
            <Box sx={{ pt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Optimization Suggestions
              </Typography>
              <List>
                {performanceMetrics?.data?.recommendations?.map((recommendation: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={recommendation}
                      secondary={`Priority: ${index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low'}`}
                    />
                  </ListItem>
                )) || (
                  <ListItem>
                    <ListItemText 
                      primary="No specific recommendations at this time"
                      secondary="Room performance is within acceptable parameters"
                    />
                  </ListItem>
                )}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                General Optimization Tips
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Monitor connection stability during peak hours"
                    secondary="Consider implementing connection pooling for better resource management"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Optimize message broadcasting"
                    secondary="Use selective broadcasting to reduce network overhead"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Implement caching strategies"
                    secondary="Cache frequently accessed game state data to improve response times"
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPerformanceMetrics(false)}>Close</Button>
          <Button variant="contained" startIcon={<RefreshIcon />}>
            Refresh Metrics
          </Button>
        </DialogActions>
      </Dialog>