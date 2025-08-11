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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Gavel as GavelIcon,
  Assignment as AssignmentIcon,
  Storage as StorageIcon,
  VpnKey as VpnKeyIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { privacyService } from '../services/privacyService';
import type { DataProtectionSettings } from '../types/privacy';
import ConsentManagementPanel from '../components/privacy/ConsentManagementPanel';
import DataSubjectRequestsPanel from '../components/privacy/DataSubjectRequestsPanel';
import DataInventoryPanel from '../components/privacy/DataInventoryPanel';
import PrivacyAuditLogsPanel from '../components/privacy/PrivacyAuditLogsPanel';
import DataBreachManagementPanel from '../components/privacy/DataBreachManagementPanel';
import EncryptionManagementPanel from '../components/privacy/EncryptionManagementPanel';
import DataAnonymizationPanel from '../components/privacy/DataAnonymizationPanel';
import PrivacySettingsDialog from '../components/privacy/PrivacySettingsDialog';
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
      id={`privacy-tabpanel-${index}`}
      aria-labelledby={`privacy-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PrivacyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // Check permissions
  const canViewPrivacy = hasPermission(Permission.SECURITY_VIEW);
  const canManagePrivacy = hasPermission(Permission.SECURITY_MANAGE);

  // Queries
  const { data: settings, isLoading: isSettingsLoading, error: settingsError } = useQuery({
    queryKey: ['privacy', 'settings'],
    queryFn: () => privacyService.getDataProtectionSettings(),
    enabled: canViewPrivacy,
  });

  const { data: complianceMetrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['privacy', 'compliance-metrics'],
    queryFn: () => privacyService.getComplianceMetrics(),
    refetchInterval: 300000, // Refresh every 5 minutes
    enabled: canViewPrivacy,
  });

  // Mutations
  const generateReportMutation = useMutation({
    mutationFn: (params: any) => privacyService.generateComplianceReport(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `privacy-compliance-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setReportDialogOpen(false);
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['privacy'] });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleGenerateReport = () => {
    const params = {
      type: 'gdpr' as const,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate: new Date(),
      includeMetrics: true,
      includeAuditLogs: true,
      includeBreaches: true,
      format: 'pdf' as const,
    };

    generateReportMutation.mutate(params);
  };

  if (!canViewPrivacy) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to view privacy and data protection information.
        </Alert>
      </Box>
    );
  }

  if (settingsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load privacy settings: {settingsError.message}
        </Alert>
      </Box>
    );
  }

  const getComplianceStatusColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getComplianceStatusIcon = (score: number) => {
    if (score >= 90) return <CheckCircleIcon color="success" />;
    if (score >= 70) return <WarningIcon color="warning" />;
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
            Privacy & Data Protection
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={refreshData} disabled={isSettingsLoading || isMetricsLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending}
            >
              {generateReportMutation.isPending ? 'Generating...' : 'Generate Report'}
            </Button>
            {canManagePrivacy && (
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setSettingsDialogOpen(true)}
              >
                Settings
              </Button>
            )}
          </Box>
        </Box>

        {/* Loading State */}
        {(isSettingsLoading || isMetricsLoading) && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Compliance Overview */}
        {complianceMetrics && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader
                  avatar={getComplianceStatusIcon(complianceMetrics.complianceScore)}
                  title="Compliance Score"
                  subheader={`Risk Level: ${complianceMetrics.riskLevel.toUpperCase()}`}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h4" color={`${getComplianceStatusColor(complianceMetrics.complianceScore)}.main`}>
                      {complianceMetrics.complianceScore}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={complianceMetrics.complianceScore}
                    color={getComplianceStatusColor(complianceMetrics.complianceScore)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader
                  avatar={<GavelIcon />}
                  title="Data Subject Requests"
                  subheader="GDPR Rights Management"
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Pending</Typography>
                    <Typography variant="h6" color="warning.main">
                      {complianceMetrics.pendingRequests}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Completed</Typography>
                    <Typography variant="h6" color="success.main">
                      {complianceMetrics.completedRequests}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader
                  avatar={<SecurityIcon />}
                  title="Data Protection"
                  subheader="Encryption & Anonymization"
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Encrypted</Typography>
                    <Typography variant="h6" color="success.main">
                      {complianceMetrics.encryptedDataPercentage}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Anonymized</Typography>
                    <Typography variant="h6" color="info.main">
                      {complianceMetrics.anonymizedDataPercentage}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* GDPR Compliance Status */}
        {settings?.gdprCompliance.enabled && (
          <Alert 
            severity={complianceMetrics?.complianceScore >= 90 ? 'success' : 'warning'} 
            sx={{ mb: 3 }}
          >
            <Typography variant="body2">
              {complianceMetrics?.complianceScore >= 90 
                ? 'GDPR compliance is active and all requirements are being met.'
                : 'GDPR compliance is active but some areas need attention. Review recommendations below.'}
            </Typography>
          </Alert>
        )}

        {/* Recommendations */}
        {complianceMetrics?.recommendations && complianceMetrics.recommendations.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Compliance Recommendations"
              subheader="Actions to improve your privacy compliance score"
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {complianceMetrics.recommendations.slice(0, 3).map((recommendation, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                      }}
                    />
                    <Typography variant="body2">{recommendation}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
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
                  <CheckCircleIcon />
                  Consent Management
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GavelIcon />
                  Data Subject Requests
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon />
                  Data Inventory
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VpnKeyIcon />
                  Encryption
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VisibilityIcon />
                  Anonymization
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon />
                  Data Breaches
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon />
                  Audit Logs
                </Box>
              }
            />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <ConsentManagementPanel />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <DataSubjectRequestsPanel />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <DataInventoryPanel />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <EncryptionManagementPanel />
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <DataAnonymizationPanel />
          </TabPanel>

          <TabPanel value={activeTab} index={5}>
            <DataBreachManagementPanel />
          </TabPanel>

          <TabPanel value={activeTab} index={6}>
            <PrivacyAuditLogsPanel />
          </TabPanel>
        </Paper>

        {/* Settings Dialog */}
        {canManagePrivacy && (
          <PrivacySettingsDialog
            open={settingsDialogOpen}
            onClose={() => setSettingsDialogOpen(false)}
            settings={settings}
          />
        )}
      </motion.div>
    </Box>
  );
};

export default PrivacyPage;