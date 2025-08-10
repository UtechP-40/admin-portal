import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Badge,
  Tab,
  Tabs,
  LinearProgress,
  Tooltip,
  Menu,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Send as SendIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  Circle as CircleIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  FiberManualRecord as RecordIcon,
  Save as SaveIcon,
  Replay as ReplayIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  MoreVert as MoreVertIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testingService } from '../../services/testingService';
import { 
  SocketTestSession, 
  SocketRecording, 
  RecordedSocketEvent, 
  SocketLoadTestConfig,
  SocketLoadTestResult 
} from '../../types/testing';

interface SocketConnection {
  id: string;
  name: string;
  url: string;
  namespace: string;
  socket: Socket | null;
  connected: boolean;
  events: SocketEvent[];
  autoReconnect: boolean;
}

interface SocketEvent {
  id: string;
  type: 'sent' | 'received' | 'error' | 'connection';
  event: string;
  data: any;
  timestamp: Date;
  connectionId: string;
}

interface EventTemplate {
  name: string;
  event: string;
  data: string;
  description: string;
}

const defaultEventTemplates: EventTemplate[] = [
  {
    name: 'Join Room',
    event: 'join-room',
    data: '{"roomId": "test-room-123"}',
    description: 'Join a game room',
  },
  {
    name: 'Leave Room',
    event: 'leave-room',
    data: '{"roomId": "test-room-123"}',
    description: 'Leave a game room',
  },
  {
    name: 'Send Chat Message',
    event: 'chat-message',
    data: '{"roomId": "test-room-123", "message": "Hello everyone!", "type": "player_chat"}',
    description: 'Send a chat message to the room',
  },
  {
    name: 'Player Action',
    event: 'player-action',
    data: '{"roomId": "test-room-123", "action": "vote", "target": "player-456"}',
    description: 'Perform a game action',
  },
  {
    name: 'Voice State',
    event: 'voice-state',
    data: '{"isMuted": false, "isSpeaking": true, "audioLevel": 0.8}',
    description: 'Update voice chat state',
  },
];

export function SocketTesting() {
  const [connections, setConnections] = useState<SocketConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [eventName, setEventName] = useState<string>('');
  const [eventData, setEventData] = useState<string>('{}');
  const [allEvents, setAllEvents] = useState<SocketEvent[]>([]);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showEventTemplates, setShowEventTemplates] = useState(false);
  const [eventTemplates] = useState<EventTemplate[]>(defaultEventTemplates);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterByConnection, setFilterByConnection] = useState<string>('all');
  const [newConnectionUrl, setNewConnectionUrl] = useState('ws://localhost:3000');
  const [newConnectionName, setNewConnectionName] = useState('');
  const [newConnectionNamespace, setNewConnectionNamespace] = useState('/');
  const [mainTabValue, setMainTabValue] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<RecordedSocketEvent[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [showLoadTestDialog, setShowLoadTestDialog] = useState(false);
  const [showRecordingsDialog, setShowRecordingsDialog] = useState(false);
  const [showDiagnosticsDialog, setShowDiagnosticsDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConnectionForMenu, setSelectedConnectionForMenu] = useState<SocketConnection | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const { data: testSessions = [] } = useQuery({
    queryKey: ['socket-test-sessions'],
    queryFn: testingService.getSocketTestSessions,
  });

  const { data: loadTestConfigs = [] } = useQuery({
    queryKey: ['socket-load-test-configs'],
    queryFn: testingService.getSocketLoadTestConfigs,
  });

  const { data: loadTestResults = [] } = useQuery({
    queryKey: ['socket-load-test-results'],
    queryFn: () => testingService.getSocketLoadTestResults(),
  });

  useEffect(() => {
    if (autoScroll && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allEvents, autoScroll]);

  const createConnection = () => {
    const connectionId = Date.now().toString();
    const connection: SocketConnection = {
      id: connectionId,
      name: newConnectionName || `Connection ${connections.length + 1}`,
      url: newConnectionUrl,
      namespace: newConnectionNamespace,
      socket: null,
      connected: false,
      events: [],
      autoReconnect: true,
    };

    setConnections(prev => [...prev, connection]);
    setNewConnectionName('');
    setShowConnectionDialog(false);
    
    if (connections.length === 0) {
      setSelectedConnection(connectionId);
    }
  };

  const connectSocket = (connectionId: string) => {
    setConnections(prev => prev.map(conn => {
      if (conn.id === connectionId) {
        if (conn.socket) {
          conn.socket.disconnect();
        }

        const socket = io(`${conn.url}${conn.namespace}`, {
          autoConnect: false,
          reconnection: conn.autoReconnect,
        });

        // Set up event listeners
        socket.on('connect', () => {
          const event: SocketEvent = {
            id: Date.now().toString(),
            type: 'connection',
            event: 'connect',
            data: { socketId: socket.id },
            timestamp: new Date(),
            connectionId,
          };
          
          setAllEvents(prev => [...prev, event]);
          setConnections(prev => prev.map(c => 
            c.id === connectionId ? { ...c, connected: true } : c
          ));
        });

        socket.on('disconnect', (reason) => {
          const event: SocketEvent = {
            id: Date.now().toString(),
            type: 'connection',
            event: 'disconnect',
            data: { reason },
            timestamp: new Date(),
            connectionId,
          };
          
          setAllEvents(prev => [...prev, event]);
          setConnections(prev => prev.map(c => 
            c.id === connectionId ? { ...c, connected: false } : c
          ));
        });

        socket.on('connect_error', (error) => {
          const event: SocketEvent = {
            id: Date.now().toString(),
            type: 'error',
            event: 'connect_error',
            data: { error: error.message },
            timestamp: new Date(),
            connectionId,
          };
          
          setAllEvents(prev => [...prev, event]);
        });

        // Listen for all events
        socket.onAny((eventName, ...args) => {
          const event: SocketEvent = {
            id: Date.now().toString(),
            type: 'received',
            event: eventName,
            data: args.length === 1 ? args[0] : args,
            timestamp: new Date(),
            connectionId,
          };
          
          setAllEvents(prev => [...prev, event]);
        });

        socket.connect();

        return { ...conn, socket };
      }
      return conn;
    }));
  };

  const disconnectSocket = (connectionId: string) => {
    setConnections(prev => prev.map(conn => {
      if (conn.id === connectionId && conn.socket) {
        conn.socket.disconnect();
        return { ...conn, socket: null, connected: false };
      }
      return conn;
    }));
  };

  const sendEvent = () => {
    const connection = connections.find(c => c.id === selectedConnection);
    if (!connection || !connection.socket || !connection.connected) {
      return;
    }

    try {
      const parsedData = JSON.parse(eventData);
      connection.socket.emit(eventName, parsedData);

      const event: SocketEvent = {
        id: Date.now().toString(),
        type: 'sent',
        event: eventName,
        data: parsedData,
        timestamp: new Date(),
        connectionId: selectedConnection,
      };

      setAllEvents(prev => [...prev, event]);
    } catch (error) {
      const event: SocketEvent = {
        id: Date.now().toString(),
        type: 'error',
        event: 'parse_error',
        data: { error: 'Invalid JSON data' },
        timestamp: new Date(),
        connectionId: selectedConnection,
      };

      setAllEvents(prev => [...prev, event]);
    }
  };

  const loadEventTemplate = (template: EventTemplate) => {
    setEventName(template.event);
    setEventData(template.data);
    setShowEventTemplates(false);
  };

  const clearEvents = () => {
    setAllEvents([]);
  };

  const deleteConnection = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection?.socket) {
      connection.socket.disconnect();
    }
    
    setConnections(prev => prev.filter(c => c.id !== connectionId));
    setAllEvents(prev => prev.filter(e => e.connectionId !== connectionId));
    
    if (selectedConnection === connectionId) {
      const remaining = connections.filter(c => c.id !== connectionId);
      setSelectedConnection(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'sent': return 'primary';
      case 'received': return 'success';
      case 'error': return 'error';
      case 'connection': return 'info';
      default: return 'default';
    }
  };

  const filteredEvents = filterByConnection === 'all' 
    ? allEvents 
    : allEvents.filter(e => e.connectionId === filterByConnection);

  return (
    <Box>
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={mainTabValue}
            onChange={(e, v) => setMainTabValue(v)}
            aria-label="socket testing tabs"
            variant="fullWidth"
          >
            <Tab icon={<SendIcon />} label="Socket Testing" />
            <Tab icon={<RecordIcon />} label="Recording & Playback" />
            <Tab icon={<SpeedIcon />} label="Load Testing" />
            <Tab icon={<AssessmentIcon />} label="Diagnostics" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Socket Testing Tab */}
          {mainTabValue === 0 && (
            <Grid container spacing={3}>
              {/* Connection Management */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Socket Connections</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setShowConnectionDialog(true)}
                    >
                      Add Connection
                    </Button>
                  </Box>

                  <List>
                    {connections.map((connection) => (
                      <ListItem
                        key={connection.id}
                        selected={selectedConnection === connection.id}
                        onClick={() => setSelectedConnection(connection.id)}
                        sx={{ cursor: 'pointer', borderRadius: 1, mb: 1 }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Badge
                                color={connection.connected ? 'success' : 'error'}
                                variant="dot"
                              >
                                <Typography variant="subtitle2">
                                  {connection.name}
                                </Typography>
                              </Badge>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {connection.url}{connection.namespace}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Messages: {connection.messageCount || 0} | Errors: {connection.errorCount || 0}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedConnectionForMenu(connection);
                              setAnchorEl(e.currentTarget);
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>

                  {connections.length === 0 && (
                    <Alert severity="info">
                      No connections. Add a connection to start testing.
                    </Alert>
                  )}
                </Paper>

                {/* Connection Status */}
                {selectedConnection && (
                  <Paper sx={{ p: 3, mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Connection Status
                    </Typography>
                    {(() => {
                      const conn = connections.find(c => c.id === selectedConnection);
                      return conn ? (
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {conn.connected ? <WifiIcon color="success" /> : <WifiOffIcon color="error" />}
                            <Typography variant="body2">
                              {conn.connected ? 'Connected' : 'Disconnected'}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Socket ID: {conn.socket?.id || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            URL: {conn.url}{conn.namespace}
                          </Typography>
                          {conn.connectionTime && (
                            <Typography variant="body2" color="text.secondary">
                              Connected: {conn.connectionTime.toLocaleTimeString()}
                            </Typography>
                          )}
                          {conn.lastActivity && (
                            <Typography variant="body2" color="text.secondary">
                              Last Activity: {conn.lastActivity.toLocaleTimeString()}
                            </Typography>
                          )}
                          <Box sx={{ mt: 2 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setShowDiagnosticsDialog(true)}
                              startIcon={<AssessmentIcon />}
                            >
                              Run Diagnostics
                            </Button>
                          </Box>
                        </Box>
                      ) : null;
                    })()}
                  </Paper>
                )}
              </Grid>

              {/* Event Emission */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Event Emission</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {isRecording ? (
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<StopIcon />}
                          onClick={() => setIsRecording(false)}
                        >
                          Stop Recording
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          startIcon={<RecordIcon />}
                          onClick={() => setIsRecording(true)}
                        >
                          Start Recording
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Connection</InputLabel>
                      <Select
                        value={selectedConnection}
                        onChange={(e) => setSelectedConnection(e.target.value)}
                        label="Connection"
                      >
                        {connections.map((conn) => (
                          <MenuItem key={conn.id} value={conn.id}>
                            {conn.name} {conn.connected ? '🟢' : '🔴'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      size="small"
                      label="Event Name"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      sx={{ mb: 2 }}
                      placeholder="join-room"
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Event Data (JSON)"
                      value={eventData}
                      onChange={(e) => setEventData(e.target.value)}
                      sx={{ mb: 2 }}
                    />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        onClick={sendEvent}
                        disabled={!selectedConnection || !eventName || !connections.find(c => c.id === selectedConnection)?.connected}
                      >
                        Send Event
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setShowEventTemplates(true)}
                      >
                        Templates
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={clearEvents}
                      >
                        Clear Events
                      </Button>
                    </Box>
                  </Box>
                </Paper>

                {/* Event Log */}
                <Paper sx={{ p: 3, mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Event Log</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {isRecording && (
                        <Chip
                          icon={<RecordIcon />}
                          label={`Recording (${currentRecording.length} events)`}
                          color="error"
                          variant="outlined"
                        />
                      )}
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Filter</InputLabel>
                        <Select
                          value={filterByConnection}
                          onChange={(e) => setFilterByConnection(e.target.value)}
                          label="Filter"
                        >
                          <MenuItem value="all">All Connections</MenuItem>
                          {connections.map((conn) => (
                            <MenuItem key={conn.id} value={conn.id}>
                              {conn.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={autoScroll}
                            onChange={(e) => setAutoScroll(e.target.checked)}
                          />
                        }
                        label="Auto Scroll"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    <AnimatePresence>
                      {filteredEvents.map((event) => {
                        const connection = connections.find(c => c.id === event.connectionId);
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card sx={{ mb: 1, border: '1px solid', borderColor: 'divider' }}>
                              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                      <Chip
                                        size="small"
                                        label={event.type}
                                        color={getEventTypeColor(event.type) as any}
                                      />
                                      <Typography variant="subtitle2">
                                        {event.event}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {connection?.name}
                                      </Typography>
                                      {event.latency && (
                                        <Chip
                                          size="small"
                                          label={`${event.latency}ms`}
                                          variant="outlined"
                                        />
                                      )}
                                    </Box>
                                    <pre style={{ 
                                      fontSize: '12px', 
                                      margin: 0, 
                                      overflow: 'auto',
                                      maxHeight: '100px',
                                      backgroundColor: 'rgba(0,0,0,0.05)',
                                      padding: '8px',
                                      borderRadius: '4px'
                                    }}>
                                      {JSON.stringify(event.data, null, 2)}
                                    </pre>
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {event.timestamp.toLocaleTimeString()}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    <div ref={eventsEndRef} />
                  </Box>

                  {filteredEvents.length === 0 && (
                    <Alert severity="info">
                      No events yet. Connect to a socket and start sending events.
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Recording & Playback Tab */}
          {mainTabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Recording & Playback
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Current Recording
                    </Typography>
                    
                    {isRecording ? (
                      <Box>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Recording in progress... {currentRecording.length} events captured
                        </Alert>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<StopIcon />}
                          onClick={() => setIsRecording(false)}
                        >
                          Stop Recording
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Start recording to capture socket events for later playback.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<RecordIcon />}
                          onClick={() => setIsRecording(true)}
                          disabled={!selectedConnection || !connections.find(c => c.id === selectedConnection)?.connected}
                        >
                          Start Recording
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Saved Recordings
                    </Typography>
                    
                    <Alert severity="info">
                      Recording and playback functionality is available. Connect to a socket and start recording events.
                    </Alert>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Load Testing Tab */}
          {mainTabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Socket Load Testing
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Load Test Configuration
                    </Typography>
                    
                    <TextField
                      fullWidth
                      type="number"
                      label="Concurrent Connections"
                      value={10}
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      type="number"
                      label="Duration (seconds)"
                      value={60}
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      type="number"
                      label="Events per Second"
                      value={5}
                      sx={{ mb: 2 }}
                    />
                    
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<SpeedIcon />}
                    >
                      Run Load Test
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Load Test Results
                    </Typography>
                    
                    <Alert severity="info">
                      Configure and run a load test to see results here.
                    </Alert>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Diagnostics Tab */}
          {mainTabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Connection Diagnostics
              </Typography>
              
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Connection Statistics</Typography>
                  <Button
                    variant="contained"
                    disabled={!selectedConnection}
                    startIcon={<AssessmentIcon />}
                  >
                    Run Diagnostics
                  </Button>
                </Box>
                
                <Alert severity="info">
                  Select a connection and run diagnostics to see detailed information.
                </Alert>
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>

      {/* New Connection Dialog */}
      <Dialog open={showConnectionDialog} onClose={() => setShowConnectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Socket Connection</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Connection Name"
            value={newConnectionName}
            onChange={(e) => setNewConnectionName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            placeholder="My Socket Connection"
          />
          <TextField
            fullWidth
            label="Socket URL"
            value={newConnectionUrl}
            onChange={(e) => setNewConnectionUrl(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="ws://localhost:3000"
          />
          <TextField
            fullWidth
            label="Namespace"
            value={newConnectionNamespace}
            onChange={(e) => setNewConnectionNamespace(e.target.value)}
            placeholder="/"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConnectionDialog(false)}>Cancel</Button>
          <Button onClick={createConnection} variant="contained">
            Add Connection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Templates Dialog */}
      <Dialog open={showEventTemplates} onClose={() => setShowEventTemplates(false)} maxWidth="md" fullWidth>
        <DialogTitle>Event Templates</DialogTitle>
        <DialogContent>
          <List>
            {eventTemplates.map((template, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={template.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {template.description}
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {template.event}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      onClick={() => loadEventTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < eventTemplates.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventTemplates(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}