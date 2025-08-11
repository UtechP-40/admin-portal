import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Security as SecurityIcon,
  VpnLock as VpnLockIcon,
  Computer as ComputerIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import MFAManagementPanel from '../components/access-control/MFAManagementPanel';
import IPRestrictionsPanel from '../components/access-control/IPRestrictionsPanel';
import SessionManagementPanel from '../components/access-control/SessionManagementPanel';
import { accessControlService } from '../services/accessControlService';
import { usePermissions } from '../hooks/usePermissions';
import type { Permission } from '../types/permissions';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const AccessControlPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [tabValue, setTabValue] = useState(0);

  // Fetch access control metrics for overview
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['access-control-metrics'],
    queryFn: () => accessControlService.getAccessControlMetrics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Check permissions
  const canManageAccessControl = hasPermission(Permission.MANAGE_SYSTEM_CONFIG);
  const canViewAccessControl = hasPermission(Permission.VIEW_SYSTEM_CONFIG);

  if (!canViewAccessControl) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          You don't have permission to view access control settings.
        </Alert>
      </Container>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Access Control & Security
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage multi-factor authentication, IP restrictions, and user sessions
        </Typography>
      </Box>

      {!canManageAccessControl && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have read-only access to access control settings. Contact an administrator to make changes.
        </Alert>
      )}

      {/* Overview Metrics */}
      {metricsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress />
        </Box>
      ) : metrics && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Security Overview
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {metrics.activeSessions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Sessions
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {metrics.mfaVerifications}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                MFA Verifications (24h)
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {metrics.failedLoginAttempts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed Logins (24h)
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {metrics.blockedAttempts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Blocked Attempts (24h)
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {metrics.trustedDevices}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Trusted Devices
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="text.primary">
                {metrics.suspiciousActivities}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Suspicious Activities (24h)
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon />
                  Multi-Factor Authentication
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VpnLockIcon />
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
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <MFAManagementPanel />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <IPRestrictionsPanel />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <SessionManagementPanel />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AccessControlPage;