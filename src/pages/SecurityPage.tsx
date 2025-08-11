import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
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
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { securityService } from '../services/securityService';
import { SecuritySeverity, SecurityEventStatus, ThreatStatus } from '../types/security';
import type { SecurityDashboardData } from '../types/security';
import SecurityEventsTable from '../components/security/SecurityEventsTable';
import SecurityThreatsTable from '../components/security/SecurityThreatsTable';
import SecurityAlertsPanel from '../components/security/SecurityAlertsPanel';
import RiskAssessmentCard from '../components/security/RiskAssessmentCard';
import SecurityMetricsCards from '../components/security/SecurityMetricsCards';
import IntrusionDetectionPanel from '../components/security/IntrusionDetectionPanel';
import SecurityConfigurationDialog from '../components/security/SecurityConfigurationDialog';
import { usePermissions } from '../hooks/usePermissions';
import type { Permission } from '../types/permissions';

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
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SecurityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'html' | 'json'>('pdf');
  
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // Check permissions
  const canViewSecurity = hasPermission(Permission.SECURITY_VIEW);
  const canManageSecurity = hasPermission(Permission.SECURITY_MANAGE);

  // Queries
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['security', 'dashboard'],
    queryFn: () => securityService.getSecurityDashboard(),
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: canViewSecurity,
  });

  const { data: healthCheck, isLoading: isHealthLoading } = useQuery({
    queryKey: ['security', 'health-check'],
    queryFn: () => securityService.performSecurityHealthCheck(),
    refetchInterval: 60000, // Refresh every minute
    enabled: canViewSecurity,
  });

  // Mutations
  const generateReportMutation = useMutation({
    mutationFn: (params: any) => securityService.generateSecurityReport(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-report-${new Date().toISOString().split('T')[0]}.${reportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setReportDialogOpen(false);
    },
  });

  const refreshDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ['security'] });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleGenerateReport = () => {
    const params = {
      type: reportType,
      format: reportFormat,
      includeMetrics: true,
      includeThreats: true,
      includeEvents: true,
    };

    if (reportType === 'custom') {
      // Add date range logic here
      params.startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      params.endDate = new Date();
    }

    generateReportMutation.mutate(params);
  };

  if (!canViewSecurity) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to view security information.
        </Alert>
      </Box>
    );
  }

  if (dashboardError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load security dashboard: {dashboardError.message}
        </Alert>
      </Box>
    );
  }

  const getSeverityColor = (severity: SecuritySeverity) => {
    switch (severity) {
      case SecuritySeverity.CRITICAL:
        return 'error';
      case SecuritySeverity.HIGH:
        return 'warning';
      case SecuritySeverity.MEDIUM:
        return 'info';
      case SecuritySeverity.LOW:
        return 'success';
      default:
        return 'default';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'critical':
        return <ErrorIcon color="error" />;
      default:
        return <SecurityIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            Security Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Dashboard">
              <IconButton onClick={refreshDashboard} disabled={isDashboardLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setReportDialogOpen(true)}
            >
              Generate Report
            </Button>
            {canManageSecurity && (
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setConfigDialogOpen(true)}
              >
                Configure
              </Button>
            )}
          </Box>
        </Box>

        {/* Health Status */}
        {healthCheck && (
          <Card sx={{ mb: 3 }}>
            <CardHeader
              avatar={getHealthStatusIcon(healthCheck.overall)}
              title={
                <Typography variant="h6">
                  Security Health Status: {healthCheck.overall.toUpperCase()}
                </Typography>
              }
              action={
                <Chip
                  label={healthCheck.overall}
                  color={
                    healthCheck.overall === 'healthy' ? 'success' :
                    healthCheck.overall === 'warning' ? 'warning' : 'error'
                  }
                />
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                {healthCheck.checks.map((check, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {check.status === 'pass' ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : check.status === 'warning' ? (
                        <WarningIcon color="warning" fontSize="small" />
                      ) : (
                        <ErrorIcon color="error" fontSize="small" />
                      )}
                      <Typography variant="body2">{check.name}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              {healthCheck.recommendations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommendations:
                  </Typography>
                  <List dense>
                    {healthCheck.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isDashboardLoading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Dashboard Content */}
        {dashboardData && (
          <>
            {/* Security Metrics Cards */}
            <SecurityMetricsCards metrics={dashboardData.metrics} />

            {/* Risk Assessment */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <RiskAssessmentCard riskAssessment={dashboardData.riskAssessment} />
              </Grid>
              <Grid item xs={12} md={6}>
                <SecurityAlertsPanel alerts={dashboardData.alerts} />
              </Grid>
            </Grid>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimelineIcon />
                      Security Events
                      <Badge badgeContent={dashboardData.metrics.totalEvents} color="primary" />
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShieldIcon />
                      Threats
                      <Badge badgeContent={dashboardData.metrics.activeThreat} color="error" />
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotificationsIcon />
                      Alerts
                      <Badge badgeContent={dashboardData.alerts.filter(a => a.isActive).length} color="warning" />
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BlockIcon />
                      Intrusion Detection
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssessmentIcon />
                      Audit Logs
                    </Box>
                  }
                />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <SecurityEventsTable />
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <SecurityThreatsTable threats={dashboardData.threats} />
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <SecurityAlertsPanel alerts={dashboardData.alerts} expanded />
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <IntrusionDetectionPanel />
              </TabPanel>

              <TabPanel value={activeTab} index={4}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Security Audit Logs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detailed audit logs will be implemented in the next phase.
                  </Typography>
                </Box>
              </TabPanel>
            </Paper>
          </>
        )}

        {/* Configuration Dialog */}
        {canManageSecurity && (
          <SecurityConfigurationDialog
            open={configDialogOpen}
            onClose={() => setConfigDialogOpen(false)}
          />
        )}

        {/* Report Generation Dialog */}
        <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Generate Security Report</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value as any)}
                >
                  <MenuItem value="daily">Daily Report</MenuItem>
                  <MenuItem value="weekly">Weekly Report</MenuItem>
                  <MenuItem value="monthly">Monthly Report</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={reportFormat}
                  label="Format"
                  onChange={(e) => setReportFormat(e.target.value as any)}
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="html">HTML</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleGenerateReport}
              variant="contained"
              disabled={generateReportMutation.isPending}
            >
              {generateReportMutation.isPending ? 'Generating...' : 'Generate'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
  );
};

export default SecurityPage;