import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';

// Placeholder interfaces for the component
interface GameRoom {
  id: string;
  code: string;
  name: string;
  hostName: string;
  players: any[];
  status: 'waiting' | 'playing' | 'finished';
  gamePhase?: 'day' | 'night' | 'voting' | 'results';
  duration: number;
  maxPlayers: number;
}

export function GameRoomMonitoring() {
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const mockRooms: GameRoom[] = [
    {
      id: '1',
      code: 'ROOM001',
      name: 'Test Room 1',
      hostName: 'Player1',
      players: [{}, {}, {}],
      status: 'playing',
      gamePhase: 'day',
      duration: 300,
      maxPlayers: 8,
    },
    {
      id: '2',
      code: 'ROOM002',
      name: 'Test Room 2',
      hostName: 'Player2',
      players: [{}, {}],
      status: 'waiting',
      duration: 120,
      maxPlayers: 6,
    },
  ];

  const mockAnalytics = {
    totalRooms: 15,
    activeRooms: 8,
    totalPlayers: 42,
    averageRoomDuration: 450,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'warning';
      case 'playing': return 'success';
      case 'finished': return 'default';
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
      <Typography variant="h4" gutterBottom>
        Game Room Monitoring
      </Typography>

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
                      {mockAnalytics.totalRooms}
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
                      {mockAnalytics.activeRooms}
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
                      {mockAnalytics.totalPlayers}
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
                      {formatDuration(mockAnalytics.averageRoomDuration)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Active Rooms List */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Active Game Rooms
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<SecurityIcon />}
                >
                  Security Alerts
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                >
                  Performance Test
                </Button>
                <IconButton>
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Box>

            {isLoading ? (
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
                    {mockRooms.map((room) => (
                      <TableRow key={room.id} hover>
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
                          {room.status === 'playing' && room.gamePhase && (
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
                            <Tooltip title="Performance Metrics">
                              <IconButton size="small">
                                <AssessmentIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {mockRooms.length === 0 && (
              <Alert severity="info">
                No active game rooms found.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Implementation Status */}
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              Game Room Monitoring - Implementation Status
            </Typography>
            <Typography paragraph>
              This component provides a foundation for comprehensive game room monitoring. 
              The following features are planned for full implementation:
            </Typography>
            <ul>
              <li>Real-time room monitoring and analytics</li>
              <li>Player action tracking and replay functionality</li>
              <li>Performance metrics and optimization suggestions</li>
              <li>Security monitoring and moderation tools</li>
              <li>Live WebSocket integration for real-time updates</li>
              <li>Advanced filtering and search capabilities</li>
            </ul>
            <Typography>
              Currently showing mock data for demonstration purposes.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}