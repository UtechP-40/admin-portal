import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Button,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Shield as ShieldIcon,
  PhoneAndroid as PhoneIcon,
  LocationOn as LocationIcon,
  Computer as ComputerIcon,
  Policy as PolicyIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { accessControlService } from '../services/accessControlService';
import { AccessControlMetrics } from '../types/accessControl';
import MFAManagementPanel from '../components/access-control/MFAManagementPanel';
import IPRestrictionsPanel from '../components/access-control/IPRestrictionsPanel';
import SessionManagementPanel from '../components/access-control/SessionManagementPanel';
import TrustedDevicesPanel from '../components/access-control/TrustedDevicesPanel';
import AccessPoliciesPanel from '../components/access-control/AccessPoliciesPanel';
import AccessAttemptsPanel from '../components/access-control/AccessAttemptsPanel';
import { usePermissions } from '../hooks/usePermissions';
import { Permission } from '../types/permissions';

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
      id={`access-control-tabpanel-${index}`}
      aria-labelledby={`access-control-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AccessControlPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // Check permissions
  const canViewSecurity = hasPermission(Permission.SECURITY_VIEW);
  const canManageSecurity = hasPermission(Permission.SECURITY_MANAGE);

  // Queries
  const { data: metrics, isLoading: isMetricsLoading, error: metricsError } = useQuery({
    queryKey: ['access-control', 'metrics'],
    queryFn: () => accessControlService.getAccessControlMetrics(),
    refetchInterval: 60000, // Refresh every minute
    enabled: canViewSecurity,
  });

  const { data: activeSessionsCount, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['access-control', 'active-sessions-count'],
    queryFn: () => accessControlService.getActiveSessionsCount(),
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: canViewSecurity,
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['access-control'] });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!canViewSecurity) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to view access control information.
        </Alert>
      </Box>
    );
  }

  if (metricsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load access control data: {metricsError.message}
        </Alert>
      </Box>
    );
  }

  const getSecurityStatusColor = (failedAttempts: number, totalAttempts: number) => {
    const failureRate = totalAttempts > 0 ? (failedAttempts / totalAttempts) * 100 : 0;
    if (failureRate <= 5) return 'success';
    if (failureRate <= 15) return 'warning';
    return 'error';
  };

  const getSecurityStatusIcon = (failedAttempts: number, totalAttempts: number) => {
    const failureRate = totalAttempts > 0 ? (failedAttempts / totalAttempts) * 100 : 0;
    if (failureRate <= 5) return <CheckCircleIcon color="success" />;
    if (failureRate <= 15) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
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
            <ShieldIcon />
            Access Control & Session Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={refreshData} disabled={isMetricsLoading || isSessionsLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                // Generate access control report
                console.log('Generate access control report');
              }}
            >
              Generate Report
            </Button>
            {canManageSecurity && (
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => {
                  // Open settings dialog
                  console.log('Open access control settings');
                }}
              >
                Settings
              </Button>
            )}
          </Box>
        </Box>

        {/* Loading State */}
        {(isMetricsLoading || isSessionsLoading) && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Metrics Overview */}
        {metrics && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardHeader
                  avatar={getSecurityStatusIcon(metrics.failedLoginAttempts, metrics.successfulLogins + metrics.failedLoginAttempts)}
                  title="Security Status"
                  subheader={`${((metrics.successfulLogins / (metrics.successfulLogins + metrics.failedLoginAttempts)) * 100).toFixed(1)}% success rate`}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Successful Logins</Typography>
                    <Typography variant="h6" color="success.main">
                      {metrics.successfulLogins.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Failed Attempts</Typography>
                    <Typography variant="h6" color="error.main">
                      {metrics.failedLoginAttempts.toLocaleString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardHeader
                  avatar={<ComputerIcon />}
                  title="Active Sessions"
                  subheader="Currently logged in users"
                />
                <CardContent>
                  <Typography variant="h4" color="primary.main" gutterBottom>
                    {activeSessionsCount?.toLocaleString() || metrics.activeSessions.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sessions: {metrics.totalSessions.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Duration: {Math.round(metrics.averageSessionDuration / 60)} min
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardHeader
                  avatar={<PhoneIcon />}
                  title="MFA Verifications"
                  subheader="Multi-factor authentication"
                />
                <CardContent>
                  <Typography variant="h4" color="info.main" gutterBottom>
                    {metrics.mfaVerifications.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trusted Devices: {metrics.trustedDevices.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardHeader
                  avatar={<SecurityIcon />}
                  title="Security Events"
                  subheader="Blocked & suspicious activities"
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Blocked Attempts</Typography>
                    <Typography variant="h6" color="error.main">
                      {metrics.blockedAttempts.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Suspicious Activities</Typography>
                    <Typography variant="h6" color="warning.main">
                      {metrics.suspiciousActivities.toLocaleString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Quick Stats */}
        {metrics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Top Failure Reasons"
                  subheader="Most common login failure causes"
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {metrics.topFailureReasons.slice(0, 5).map((reason, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">{reason.reason}</Typography>
                        <Chip
                          label={reason.count.toLocaleString()}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Login Locations"
                  subheader="Geographic distribution of logins"
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {metrics.loginsByLocation.slice(0, 5).map((location, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon fontSize="small" />
                          <Typography variant="body2">{location.country}</Typography>
                        </Box>
                        <Chip
                          label={location.count.toLocaleString()}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

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
                  <PhoneIcon />
                  Multi-Factor Auth
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon />
                  IP Restrictions
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ComputerIcon />
                  Session Management
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShieldIcon />
                  Trusted Devices
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PolicyIcon />
                  Access Policies
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon />
                  Access Attempts
                </Box>
              }
            />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <MFAManagementPanel />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <IPRestrictionsPanel />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <SessionManagementPanel />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <TrustedDevicesPanel />
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <AccessPoliciesPanel />
          </TabPanel>

          <TabPanel value={activeTab} index={5}>
            <AccessAttemptsPanel />
          </TabPanel>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default AccessControlPage;