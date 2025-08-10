import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Gavel as GavelIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Flag as FlagIcon,
  Shield as ShieldIcon,
  Report as ReportIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';

interface CheatDetectionAlert {
  id: string;
  playerId: string;
  playerName: string;
  roomId: string;
  roomCode: string;
  type: 'speed_hacking' | 'pattern_anomaly' | 'impossible_action' | 'coordination_suspicious';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  evidence: any[];
  timestamp: string;
  status: 'pending' | 'investigating' | 'confirmed' | 'false_positive';
  assignedTo?: string;
}

interface PlayerRiskProfile {
  playerId: string;
  playerName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  behaviorMetrics: {
    averageResponseTime: number;
    actionPatternConsistency: number;
    socialInteractionScore: number;
    gameKnowledgeLevel: number;
    suspiciousActivityCount: number;
  };
  recentFlags: number;
  accountAge: number;
  gamesPlayed: number;
  winRate: number;
  reportCount: number;
  lastUpdated: string;
}

interface ModerationCase {
  id: string;
  playerId: string;
  playerName: string;
  type: 'cheating' | 'harassment' | 'inappropriate_content' | 'griefing' | 'account_sharing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'investigating' | 'pending_action' | 'resolved' | 'closed';
  assignedModerator?: string;
  description: string;
  evidence: any[];
  actions: ModerationAction[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

interface ModerationAction {
  id: string;
  type: 'warning' | 'temporary_ban' | 'permanent_ban' | 'account_restriction' | 'no_action';
  duration?: number;
  reason: string;
  moderator: string;
  timestamp: string;
  notes?: string;
}

export function SecurityModerationTools() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState<CheatDetectionAlert | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<ModerationCase | null>(null);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(true);
  const [detectionSensitivity, setDetectionSensitivity] = useState('medium');

  const queryClient = useQueryClient();

  // Fetch cheat detection alerts
  const { data: cheatAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['cheat-alerts'],
    queryFn: () => apiService.get('/admin/security/cheat-detection'),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch player risk profiles
  const { data: riskProfiles } = useQuery({
    queryKey: ['player-risk-profiles'],
    queryFn: () => apiService.get('/admin/security/risk-profiles'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch moderation cases
  const { data: moderationCases } = useQuery({
    queryKey: ['moderation-cases'],
    queryFn: () => apiService.get('/admin/moderation/cases'),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch player profile details
  const { data: playerProfile } = useQuery({
    queryKey: ['player-profile', selectedPlayer],
    queryFn: () => apiService.get(`/admin/security/player-profile/${selectedPlayer}`),
    enabled: !!selectedPlayer,
  });

  // Mutations
  const updateAlertMutation = useMutation({
    mutationFn: ({ alertId, status }: { alertId: string; status: string }) =>
      apiService.put(`/admin/security/cheat-detection/${alertId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheat-alerts'] });
    },
  });

  const createModerationCaseMutation = useMutation({
    mutationFn: (caseData: Partial<ModerationCase>) =>
      apiService.post('/admin/moderation/cases', caseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-cases'] });
      setShowNewCaseDialog(false);
    },
  });

  const updateModerationCaseMutation = useMutation({
    mutationFn: ({ caseId, updates }: { caseId: string; updates: Partial<ModerationCase> }) =>
      apiService.put(`/admin/moderation/cases/${caseId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-cases'] });
    },
  });

  const applyModerationActionMutation = useMutation({
    mutationFn: ({ caseId, action }: { caseId: string; action: ModerationAction }) =>
      apiService.post(`/admin/moderation/cases/${caseId}/actions`, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-cases'] });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'default';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Cheat Detection" icon={<ShieldIcon />} />
          <Tab label="Player Risk Analysis" icon={<AssessmentIcon />} />
          <Tab label="Moderation Cases" icon={<GavelIcon />} />
          <Tab label="Settings" icon={<SecurityIcon />} />
        </Tabs>
      </Paper>

      {/* Cheat Detection Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Automated Cheat Detection
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoDetectionEnabled}
                        onChange={(e) => setAutoDetectionEnabled(e.target.checked)}
                      />
                    }
                    label="Auto Detection"
                  />
                  <Badge
                    badgeContent={cheatAlerts?.data?.filter((a: CheatDetectionAlert) => a.status === 'pending').length || 0}
                    color="error"
                  >
                    <Button variant="outlined" startIcon={<FlagIcon />}>
                      Pending Alerts
                    </Button>
                  </Badge>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Alerts Today
                      </Typography>
                      <Typography variant="h4">
                        {cheatAlerts?.data?.length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        High Priority
                      </Typography>
                      <Typography variant="h4" color="error.main">
                        {cheatAlerts?.data?.filter((a: CheatDetectionAlert) => a.severity === 'high' || a.severity === 'critical').length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Confirmed Cheats
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {cheatAlerts?.data?.filter((a: CheatDetectionAlert) => a.status === 'confirmed').length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        False Positives
                      </Typography>
                      <Typography variant="h4">
                        {cheatAlerts?.data?.filter((a: CheatDetectionAlert) => a.status === 'false_positive').length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Player</TableCell>
                      <TableCell>Room</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cheatAlerts?.data?.map((alert: CheatDetectionAlert) => (
                      <TableRow key={alert.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" />
                            <Typography variant="body2">
                              {alert.playerName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{alert.roomCode}</TableCell>
                        <TableCell>
                          <Chip
                            label={alert.type.replace('_', ' ')}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={alert.severity}
                            color={getSeverityColor(alert.severity) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={alert.confidence * 100}
                              sx={{ width: 60, height: 6 }}
                            />
                            <Typography variant="caption">
                              {(alert.confidence * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={alert.status}
                            color={alert.status === 'confirmed' ? 'error' : alert.status === 'false_positive' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedAlert(alert);
                                  setShowAlertDetails(true);
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Create Case">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  // Pre-fill case creation with alert data
                                  setShowNewCaseDialog(true);
                                }}
                              >
                                <ReportIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Player Risk Analysis Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Player Risk Profiles
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                AI-powered behavior analysis and risk scoring for proactive moderation
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Player</TableCell>
                      <TableCell>Risk Score</TableCell>
                      <TableCell>Risk Level</TableCell>
                      <TableCell>Recent Flags</TableCell>
                      <TableCell>Games Played</TableCell>
                      <TableCell>Win Rate</TableCell>
                      <TableCell>Reports</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {riskProfiles?.data?.map((profile: PlayerRiskProfile) => (
                      <TableRow key={profile.playerId} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {profile.playerName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={profile.riskScore}
                              color={profile.riskScore > 70 ? 'error' : profile.riskScore > 40 ? 'warning' : 'success'}
                              sx={{ width: 80, height: 8 }}
                            />
                            <Typography variant="body2">
                              {profile.riskScore}/100
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={profile.riskLevel}
                            color={getRiskLevelColor(profile.riskLevel) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge badgeContent={profile.recentFlags} color="error">
                            <FlagIcon />
                          </Badge>
                        </TableCell>
                        <TableCell>{profile.gamesPlayed}</TableCell>
                        <TableCell>{(profile.winRate * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge badgeContent={profile.reportCount} color="warning">
                            <ReportIcon />
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedPlayer(profile.playerId);
                              setShowPlayerProfile(true);
                            }}
                          >
                            View Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Moderation Cases Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Moderation Cases
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<ReportIcon />}
                  onClick={() => setShowNewCaseDialog(true)}
                >
                  Create Case
                </Button>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Open Cases
                      </Typography>
                      <Typography variant="h4">
                        {moderationCases?.data?.filter((c: ModerationCase) => c.status === 'open').length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Investigating
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {moderationCases?.data?.filter((c: ModerationCase) => c.status === 'investigating').length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Pending Action
                      </Typography>
                      <Typography variant="h4" color="error.main">
                        {moderationCases?.data?.filter((c: ModerationCase) => c.status === 'pending_action').length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Resolved Today
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {moderationCases?.data?.filter((c: ModerationCase) => c.status === 'resolved').length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Case ID</TableCell>
                      <TableCell>Player</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {moderationCases?.data?.map((moderationCase: ModerationCase) => (
                      <TableRow key={moderationCase.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            #{moderationCase.id.slice(-6)}
                          </Typography>
                        </TableCell>
                        <TableCell>{moderationCase.playerName}</TableCell>
                        <TableCell>
                          <Chip
                            label={moderationCase.type.replace('_', ' ')}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={moderationCase.priority}
                            color={getPriorityColor(moderationCase.priority) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={moderationCase.status.replace('_', ' ')}
                            color={moderationCase.status === 'resolved' ? 'success' : moderationCase.status === 'pending_action' ? 'error' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {moderationCase.assignedModerator || 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(moderationCase.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedCase(moderationCase);
                              setShowCaseDetails(true);
                            }}
                          >
                            View Case
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Settings Tab */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Detection Settings
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Auto Detection"
                    secondary="Automatically detect suspicious behavior patterns"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={autoDetectionEnabled}
                      onChange={(e) => setAutoDetectionEnabled(e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Detection Sensitivity"
                    secondary="Adjust the sensitivity of cheat detection algorithms"
                  />
                  <ListItemSecondaryAction>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={detectionSensitivity}
                        onChange={(e) => setDetectionSensitivity(e.target.value)}
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Moderation Settings
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Auto-assign Cases"
                    secondary="Automatically assign new cases to available moderators"
                  />
                  <ListItemSecondaryAction>
                    <Switch defaultChecked />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Escalation Threshold"
                    secondary="Risk score threshold for automatic case escalation"
                  />
                  <ListItemSecondaryAction>
                    <TextField
                      size="small"
                      type="number"
                      defaultValue={75}
                      sx={{ width: 80 }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Alert Details Dialog */}
      <Dialog open={showAlertDetails} onClose={() => setShowAlertDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Cheat Detection Alert Details
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Player Information
                  </Typography>
                  <Typography>Name: {selectedAlert.playerName}</Typography>
                  <Typography>Room: {selectedAlert.roomCode}</Typography>
                  <Typography>Time: {new Date(selectedAlert.timestamp).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Detection Details
                  </Typography>
                  <Typography>Type: {selectedAlert.type.replace('_', ' ')}</Typography>
                  <Typography>Severity: {selectedAlert.severity}</Typography>
                  <Typography>Confidence: {(selectedAlert.confidence * 100).toFixed(1)}%</Typography>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle2" gutterBottom>
                Description
              </Typography>
              <Typography paragraph>
                {selectedAlert.description}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Evidence
              </Typography>
              <pre style={{ fontSize: '12px', overflow: 'auto', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                {JSON.stringify(selectedAlert.evidence, null, 2)}
              </pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAlertDetails(false)}>Close</Button>
          <Button
            color="success"
            onClick={() => {
              if (selectedAlert) {
                updateAlertMutation.mutate({ alertId: selectedAlert.id, status: 'false_positive' });
                setShowAlertDetails(false);
              }
            }}
          >
            Mark False Positive
          </Button>
          <Button
            color="error"
            onClick={() => {
              if (selectedAlert) {
                updateAlertMutation.mutate({ alertId: selectedAlert.id, status: 'confirmed' });
                setShowAlertDetails(false);
              }
            }}
          >
            Confirm Cheat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Player Profile Dialog */}
      <Dialog open={showPlayerProfile} onClose={() => setShowPlayerProfile(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Player Risk Profile
        </DialogTitle>
        <DialogContent>
          {playerProfile?.data && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Risk Assessment
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Overall Risk Score: {playerProfile.data.riskScore}/100
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={playerProfile.data.riskScore}
                      color={playerProfile.data.riskScore > 70 ? 'error' : playerProfile.data.riskScore > 40 ? 'warning' : 'success'}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Chip
                    label={`${playerProfile.data.riskLevel} Risk`}
                    color={getRiskLevelColor(playerProfile.data.riskLevel) as any}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Behavior Metrics
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Response Time"
                        secondary={`${playerProfile.data.behaviorMetrics.averageResponseTime}ms avg`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Pattern Consistency"
                        secondary={`${(playerProfile.data.behaviorMetrics.actionPatternConsistency * 100).toFixed(1)}%`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Social Interaction"
                        secondary={`${(playerProfile.data.behaviorMetrics.socialInteractionScore * 100).toFixed(1)}%`}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPlayerProfile(false)}>Close</Button>
          <Button variant="contained">Create Moderation Case</Button>
        </DialogActions>
      </Dialog>

      {/* Case Details Dialog */}
      <Dialog open={showCaseDetails} onClose={() => setShowCaseDetails(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Moderation Case Details
        </DialogTitle>
        <DialogContent>
          {selectedCase && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Case Information
                  </Typography>
                  <Typography>Case ID: #{selectedCase.id.slice(-6)}</Typography>
                  <Typography>Player: {selectedCase.playerName}</Typography>
                  <Typography>Type: {selectedCase.type.replace('_', ' ')}</Typography>
                  <Typography>Priority: {selectedCase.priority}</Typography>
                  <Typography>Status: {selectedCase.status.replace('_', ' ')}</Typography>
                  <Typography>Created: {new Date(selectedCase.createdAt).toLocaleString()}</Typography>
                  
                  <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
                    Description
                  </Typography>
                  <Typography paragraph>
                    {selectedCase.description}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Actions History
                  </Typography>
                  <List>
                    {selectedCase.actions.map((action, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={action.type.replace('_', ' ')}
                          secondary={`${action.moderator} - ${new Date(action.timestamp).toLocaleString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCaseDetails(false)}>Close</Button>
          <Button color="warning">Apply Warning</Button>
          <Button color="error">Apply Ban</Button>
        </DialogActions>
      </Dialog>

      {/* New Case Dialog */}
      <Dialog open={showNewCaseDialog} onClose={() => setShowNewCaseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Create Moderation Case
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Player Name"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Case Type</InputLabel>
              <Select label="Case Type">
                <MenuItem value="cheating">Cheating</MenuItem>
                <MenuItem value="harassment">Harassment</MenuItem>
                <MenuItem value="inappropriate_content">Inappropriate Content</MenuItem>
                <MenuItem value="griefing">Griefing</MenuItem>
                <MenuItem value="account_sharing">Account Sharing</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select label="Priority">
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewCaseDialog(false)}>Cancel</Button>
          <Button variant="contained">Create Case</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}