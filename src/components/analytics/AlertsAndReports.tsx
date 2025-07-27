import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Box,
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
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Notifications,
  Schedule,
  Assessment,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsService, AlertRule, ScheduledReport } from '../../services/analytics';

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
      id={`alerts-tabpanel-${index}`}
      aria-labelledby={`alerts-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AlertsAndReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertRule | null>(null);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);

  const queryClient = useQueryClient();

  // Fetch alert rules
  const { data: alertRules = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alertRules'],
    queryFn: () => analyticsService.getAlertRules(),
  });

  // Fetch scheduled reports
  const { data: scheduledReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['scheduledReports'],
    queryFn: () => analyticsService.getScheduledReports(),
  });

  // Alert mutations
  const createAlertMutation = useMutation({
    mutationFn: (alert: Omit<AlertRule, 'id'>) => analyticsService.createAlertRule(alert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
      setAlertDialogOpen(false);
      setEditingAlert(null);
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, alert }: { id: string; alert: Partial<AlertRule> }) =>
      analyticsService.updateAlertRule(id, alert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
      setAlertDialogOpen(false);
      setEditingAlert(null);
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id: string) => analyticsService.deleteAlertRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
    },
  });

  const testAlertMutation = useMutation({
    mutationFn: (id: string) => analyticsService.testAlertRule(id),
  });

  // Report mutations
  const createReportMutation = useMutation({
    mutationFn: (report: Omit<ScheduledReport, 'id'>) => analyticsService.createScheduledReport(report),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
      setReportDialogOpen(false);
      setEditingReport(null);
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, report }: { id: string; report: Partial<ScheduledReport> }) =>
      analyticsService.updateScheduledReport(id, report),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
      setReportDialogOpen(false);
      setEditingReport(null);
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id: string) => analyticsService.deleteScheduledReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
    },
  });

  const runReportMutation = useMutation({
    mutationFn: (id: string) => analyticsService.runScheduledReport(id),
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateAlert = () => {
    setEditingAlert(null);
    setAlertDialogOpen(true);
  };

  const handleEditAlert = (alert: AlertRule) => {
    setEditingAlert(alert);
    setAlertDialogOpen(true);
  };

  const handleCreateReport = () => {
    setEditingReport(null);
    setReportDialogOpen(true);
  };

  const handleEditReport = (report: ScheduledReport) => {
    setEditingReport(report);
    setReportDialogOpen(true);
  };

  const formatAlertStatus = (enabled: boolean) => (
    <Chip
      icon={enabled ? <CheckCircle /> : <Pause />}
      label={enabled ? 'Active' : 'Inactive'}
      color={enabled ? 'success' : 'default'}
      size="small"
    />
  );

  const formatReportStatus = (enabled: boolean, lastRun?: Date) => (
    <Box>
      <Chip
        icon={enabled ? <CheckCircle /> : <Pause />}
        label={enabled ? 'Active' : 'Inactive'}
        color={enabled ? 'success' : 'default'}
        size="small"
      />
      {lastRun && (
        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
          Last run: {new Date(lastRun).toLocaleString()}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Alerts & Reports
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Notifications />
                  Alert Rules
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Schedule />
                  Scheduled Reports
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Alert Rules Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Alert Rules</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateAlert}
            >
              Create Alert Rule
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Threshold</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notifications</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alertRules.map((alert) => (
                  <TableRow key={alert.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {alert.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {alert.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {alert.condition}
                      </Typography>
                    </TableCell>
                    <TableCell>{alert.threshold}</TableCell>
                    <TableCell>{formatAlertStatus(alert.enabled)}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {alert.notificationChannels.map((channel) => (
                          <Chip key={channel} label={channel} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => testAlertMutation.mutate(alert.id)}
                          disabled={testAlertMutation.isPending}
                        >
                          <PlayArrow />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEditAlert(alert)}>
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => deleteAlertMutation.mutate(alert.id)}
                          disabled={deleteAlertMutation.isPending}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {alertRules.length === 0 && (
            <Box textAlign="center" py={4}>
              <Warning sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Alert Rules Configured
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Create alert rules to monitor your system and get notified of important events.
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={handleCreateAlert}>
                Create Your First Alert Rule
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Scheduled Reports Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Scheduled Reports</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateReport}
            >
              Create Scheduled Report
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Report Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Next Run</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scheduledReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {report.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {report.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {report.schedule}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={report.reportType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{formatReportStatus(report.enabled, report.lastRun)}</TableCell>
                    <TableCell>
                      {report.nextRun ? (
                        <Typography variant="body2">
                          {new Date(report.nextRun).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not scheduled
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => runReportMutation.mutate(report.id)}
                          disabled={runReportMutation.isPending}
                        >
                          <PlayArrow />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEditReport(report)}>
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => deleteReportMutation.mutate(report.id)}
                          disabled={deleteReportMutation.isPending}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {scheduledReports.length === 0 && (
            <Box textAlign="center" py={4}>
              <Assessment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Scheduled Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Create scheduled reports to automatically generate and deliver analytics insights.
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={handleCreateReport}>
                Create Your First Report
              </Button>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Alert Rule Dialog */}
      <AlertRuleDialog
        open={alertDialogOpen}
        alert={editingAlert}
        onClose={() => {
          setAlertDialogOpen(false);
          setEditingAlert(null);
        }}
        onSave={(alertData) => {
          if (editingAlert) {
            updateAlertMutation.mutate({ id: editingAlert.id, alert: alertData });
          } else {
            createAlertMutation.mutate(alertData as Omit<AlertRule, 'id'>);
          }
        }}
      />

      {/* Scheduled Report Dialog */}
      <ScheduledReportDialog
        open={reportDialogOpen}
        report={editingReport}
        onClose={() => {
          setReportDialogOpen(false);
          setEditingReport(null);
        }}
        onSave={(reportData) => {
          if (editingReport) {
            updateReportMutation.mutate({ id: editingReport.id, report: reportData });
          } else {
            createReportMutation.mutate(reportData as Omit<ScheduledReport, 'id'>);
          }
        }}
      />
    </Box>
  );
};

// Alert Rule Dialog Component
interface AlertRuleDialogProps {
  open: boolean;
  alert: AlertRule | null;
  onClose: () => void;
  onSave: (alert: Partial<AlertRule>) => void;
}

const AlertRuleDialog: React.FC<AlertRuleDialogProps> = ({ open, alert, onClose, onSave }) => {
  const [alertData, setAlertData] = useState<Partial<AlertRule>>({
    name: '',
    description: '',
    condition: '',
    threshold: 0,
    enabled: true,
    notificationChannels: []
  });

  React.useEffect(() => {
    if (alert) {
      setAlertData(alert);
    } else {
      setAlertData({
        name: '',
        description: '',
        condition: '',
        threshold: 0,
        enabled: true,
        notificationChannels: []
      });
    }
  }, [alert]);

  const handleSave = () => {
    onSave(alertData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{alert ? 'Edit Alert Rule' : 'Create Alert Rule'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Rule Name"
              value={alertData.name || ''}
              onChange={(e) => setAlertData({ ...alertData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={alertData.enabled || false}
                  onChange={(e) => setAlertData({ ...alertData, enabled: e.target.checked })}
                />
              }
              label="Enabled"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={alertData.description || ''}
              onChange={(e) => setAlertData({ ...alertData, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Condition"
              placeholder="e.g., error_rate > threshold"
              value={alertData.condition || ''}
              onChange={(e) => setAlertData({ ...alertData, condition: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Threshold"
              value={alertData.threshold || 0}
              onChange={(e) => setAlertData({ ...alertData, threshold: parseFloat(e.target.value) || 0 })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notification Channels (comma-separated)"
              placeholder="email, slack, webhook"
              value={alertData.notificationChannels?.join(', ') || ''}
              onChange={(e) =>
                setAlertData({
                  ...alertData,
                  notificationChannels: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {alert ? 'Update' : 'Create'} Alert Rule
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Scheduled Report Dialog Component
interface ScheduledReportDialogProps {
  open: boolean;
  report: ScheduledReport | null;
  onClose: () => void;
  onSave: (report: Partial<ScheduledReport>) => void;
}

const ScheduledReportDialog: React.FC<ScheduledReportDialogProps> = ({ open, report, onClose, onSave }) => {
  const [reportData, setReportData] = useState<Partial<ScheduledReport>>({
    name: '',
    description: '',
    schedule: '0 9 * * *',
    reportType: 'dashboard',
    parameters: {},
    enabled: true
  });

  React.useEffect(() => {
    if (report) {
      setReportData(report);
    } else {
      setReportData({
        name: '',
        description: '',
        schedule: '0 9 * * *',
        reportType: 'dashboard',
        parameters: {},
        enabled: true
      });
    }
  }, [report]);

  const handleSave = () => {
    onSave(reportData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{report ? 'Edit Scheduled Report' : 'Create Scheduled Report'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Report Name"
              value={reportData.name || ''}
              onChange={(e) => setReportData({ ...reportData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={reportData.enabled || false}
                  onChange={(e) => setReportData({ ...reportData, enabled: e.target.checked })}
                />
              }
              label="Enabled"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={reportData.description || ''}
              onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Schedule (Cron Expression)"
              placeholder="0 9 * * * (9 AM daily)"
              value={reportData.schedule || ''}
              onChange={(e) => setReportData({ ...reportData, schedule: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportData.reportType || 'dashboard'}
                label="Report Type"
                onChange={(e) => setReportData({ ...reportData, reportType: e.target.value })}
              >
                <MenuItem value="dashboard">Dashboard Summary</MenuItem>
                <MenuItem value="users">User Analytics</MenuItem>
                <MenuItem value="games">Game Analytics</MenuItem>
                <MenuItem value="system">System Performance</MenuItem>
                <MenuItem value="custom">Custom Report</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Parameters (JSON)"
              value={JSON.stringify(reportData.parameters || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parameters = JSON.parse(e.target.value);
                  setReportData({ ...reportData, parameters });
                } catch (error) {
                  // Invalid JSON, don't update
                }
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {report ? 'Update' : 'Create'} Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertsAndReports;