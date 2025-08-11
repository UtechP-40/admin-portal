import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Monitor as MonitorIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityService } from '../../services/securityService';
import type { SecurityConfiguration } from '../../types/security';

interface SecurityConfigurationDialogProps {
  open: boolean;
  onClose: () => void;
}

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
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const SecurityConfigurationDialog: React.FC<SecurityConfigurationDialogProps> = ({
  open,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState<SecurityConfiguration>({
    alertThresholds: {
      failedLoginAttempts: 5,
      suspiciousActivityScore: 7,
      rateLimit: 100,
      bruteForceWindow: 15,
    },
    ipBlocking: {
      enabled: true,
      autoBlockThreshold: 10,
      blockDuration: 60,
      whitelist: [],
      blacklist: [],
    },
    monitoring: {
      realTimeEnabled: true,
      logRetentionDays: 90,
      anomalyDetectionEnabled: true,
      correlationRulesEnabled: true,
    },
    notifications: {
      emailEnabled: true,
      webhookEnabled: false,
      slackEnabled: false,
      recipients: [],
    },
  });
  const [newIpAddress, setNewIpAddress] = useState('');
  const [newRecipient, setNewRecipient] = useState('');

  const queryClient = useQueryClient();

  // Query for current configuration
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['security', 'configuration'],
    queryFn: () => securityService.getSecurityConfiguration(),
    enabled: open,
  });

  // Mutation for updating configuration
  const updateConfigMutation = useMutation({
    mutationFn: (newConfig: Partial<SecurityConfiguration>) =>
      securityService.updateSecurityConfiguration(newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security'] });
      onClose();
    },
  });

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
  }, [currentConfig]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSave = () => {
    updateConfigMutation.mutate(config);
  };

  const handleAddToWhitelist = () => {
    if (newIpAddress.trim() && !config.ipBlocking.whitelist.includes(newIpAddress.trim())) {
      setConfig({
        ...config,
        ipBlocking: {
          ...config.ipBlocking,
          whitelist: [...config.ipBlocking.whitelist, newIpAddress.trim()],
        },
      });
      setNewIpAddress('');
    }
  };

  const handleAddToBlacklist = () => {
    if (newIpAddress.trim() && !config.ipBlocking.blacklist.includes(newIpAddress.trim())) {
      setConfig({
        ...config,
        ipBlocking: {
          ...config.ipBlocking,
          blacklist: [...config.ipBlocking.blacklist, newIpAddress.trim()],
        },
      });
      setNewIpAddress('');
    }
  };

  const handleRemoveFromWhitelist = (ip: string) => {
    setConfig({
      ...config,
      ipBlocking: {
        ...config.ipBlocking,
        whitelist: config.ipBlocking.whitelist.filter(item => item !== ip),
      },
    });
  };

  const handleRemoveFromBlacklist = (ip: string) => {
    setConfig({
      ...config,
      ipBlocking: {
        ...config.ipBlocking,
        blacklist: config.ipBlocking.blacklist.filter(item => item !== ip),
      },
    });
  };

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !config.notifications.recipients.includes(newRecipient.trim())) {
      setConfig({
        ...config,
        notifications: {
          ...config.notifications,
          recipients: [...config.notifications.recipients, newRecipient.trim()],
        },
      });
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (recipient: string) => {
    setConfig({
      ...config,
      notifications: {
        ...config.notifications,
        recipients: config.notifications.recipients.filter(item => item !== recipient),
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Security Configuration</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon />
                  Alert Thresholds
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BlockIcon />
                  IP Blocking
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MonitorIcon />
                  Monitoring
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon />
                  Notifications
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Alert Thresholds Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              Configure thresholds for automatic security alert generation.
            </Alert>
            
            <TextField
              label="Failed Login Attempts"
              type="number"
              value={config.alertThresholds.failedLoginAttempts}
              onChange={(e) => setConfig({
                ...config,
                alertThresholds: {
                  ...config.alertThresholds,
                  failedLoginAttempts: parseInt(e.target.value) || 0,
                },
              })}
              helperText="Number of failed login attempts before triggering an alert"
              fullWidth
            />
            
            <TextField
              label="Suspicious Activity Score"
              type="number"
              value={config.alertThresholds.suspiciousActivityScore}
              onChange={(e) => setConfig({
                ...config,
                alertThresholds: {
                  ...config.alertThresholds,
                  suspiciousActivityScore: parseInt(e.target.value) || 0,
                },
              })}
              helperText="Risk score threshold (1-10) for suspicious activity alerts"
              inputProps={{ min: 1, max: 10 }}
              fullWidth
            />
            
            <TextField
              label="Rate Limit (requests/minute)"
              type="number"
              value={config.alertThresholds.rateLimit}
              onChange={(e) => setConfig({
                ...config,
                alertThresholds: {
                  ...config.alertThresholds,
                  rateLimit: parseInt(e.target.value) || 0,
                },
              })}
              helperText="Maximum requests per minute before rate limiting"
              fullWidth
            />
            
            <TextField
              label="Brute Force Window (minutes)"
              type="number"
              value={config.alertThresholds.bruteForceWindow}
              onChange={(e) => setConfig({
                ...config,
                alertThresholds: {
                  ...config.alertThresholds,
                  bruteForceWindow: parseInt(e.target.value) || 0,
                },
              })}
              helperText="Time window for detecting brute force attacks"
              fullWidth
            />
          </Box>
        </TabPanel>

        {/* IP Blocking Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              Configure automatic IP blocking and maintain whitelist/blacklist.
            </Alert>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.ipBlocking.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    ipBlocking: {
                      ...config.ipBlocking,
                      enabled: e.target.checked,
                    },
                  })}
                />
              }
              label="Enable Automatic IP Blocking"
            />
            
            <TextField
              label="Auto Block Threshold"
              type="number"
              value={config.ipBlocking.autoBlockThreshold}
              onChange={(e) => setConfig({
                ...config,
                ipBlocking: {
                  ...config.ipBlocking,
                  autoBlockThreshold: parseInt(e.target.value) || 0,
                },
              })}
              helperText="Number of violations before automatically blocking an IP"
              disabled={!config.ipBlocking.enabled}
              fullWidth
            />
            
            <TextField
              label="Block Duration (minutes)"
              type="number"
              value={config.ipBlocking.blockDuration}
              onChange={(e) => setConfig({
                ...config,
                ipBlocking: {
                  ...config.ipBlocking,
                  blockDuration: parseInt(e.target.value) || 0,
                },
              })}
              helperText="How long to block IPs (0 = permanent)"
              disabled={!config.ipBlocking.enabled}
              fullWidth
            />

            <Divider />

            {/* IP Whitelist */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                IP Whitelist ({config.ipBlocking.whitelist.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="IP Address"
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                  placeholder="192.168.1.100 or 10.0.0.0/24"
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddToWhitelist}
                  disabled={!newIpAddress.trim()}
                >
                  Add to Whitelist
                </Button>
              </Box>
              <List dense>
                {config.ipBlocking.whitelist.map((ip, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={ip} />
                    <ListItemSecondaryAction>
                      <Tooltip title="Remove from whitelist">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveFromWhitelist(ip)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {config.ipBlocking.whitelist.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No whitelisted IPs"
                      secondary="Add trusted IP addresses that should never be blocked"
                    />
                  </ListItem>
                )}
              </List>
            </Box>

            <Divider />

            {/* IP Blacklist */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                IP Blacklist ({config.ipBlocking.blacklist.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="IP Address"
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                  placeholder="192.168.1.100 or 10.0.0.0/24"
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddToBlacklist}
                  disabled={!newIpAddress.trim()}
                  color="error"
                >
                  Add to Blacklist
                </Button>
              </Box>
              <List dense>
                {config.ipBlocking.blacklist.map((ip, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={ip} />
                    <ListItemSecondaryAction>
                      <Tooltip title="Remove from blacklist">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveFromBlacklist(ip)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {config.ipBlocking.blacklist.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No blacklisted IPs"
                      secondary="Add known malicious IP addresses to block permanently"
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </Box>
        </TabPanel>

        {/* Monitoring Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              Configure security monitoring and logging settings.
            </Alert>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.monitoring.realTimeEnabled}
                  onChange={(e) => setConfig({
                    ...config,
                    monitoring: {
                      ...config.monitoring,
                      realTimeEnabled: e.target.checked,
                    },
                  })}
                />
              }
              label="Enable Real-time Monitoring"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.monitoring.anomalyDetectionEnabled}
                  onChange={(e) => setConfig({
                    ...config,
                    monitoring: {
                      ...config.monitoring,
                      anomalyDetectionEnabled: e.target.checked,
                    },
                  })}
                />
              }
              label="Enable Anomaly Detection"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.monitoring.correlationRulesEnabled}
                  onChange={(e) => setConfig({
                    ...config,
                    monitoring: {
                      ...config.monitoring,
                      correlationRulesEnabled: e.target.checked,
                    },
                  })}
                />
              }
              label="Enable Event Correlation Rules"
            />
            
            <TextField
              label="Log Retention (days)"
              type="number"
              value={config.monitoring.logRetentionDays}
              onChange={(e) => setConfig({
                ...config,
                monitoring: {
                  ...config.monitoring,
                  logRetentionDays: parseInt(e.target.value) || 0,
                },
              })}
              helperText="How long to keep security logs (minimum 30 days recommended)"
              inputProps={{ min: 1 }}
              fullWidth
            />
          </Box>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              Configure notification channels for security alerts.
            </Alert>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.notifications.emailEnabled}
                  onChange={(e) => setConfig({
                    ...config,
                    notifications: {
                      ...config.notifications,
                      emailEnabled: e.target.checked,
                    },
                  })}
                />
              }
              label="Enable Email Notifications"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.notifications.webhookEnabled}
                  onChange={(e) => setConfig({
                    ...config,
                    notifications: {
                      ...config.notifications,
                      webhookEnabled: e.target.checked,
                    },
                  })}
                />
              }
              label="Enable Webhook Notifications"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.notifications.slackEnabled}
                  onChange={(e) => setConfig({
                    ...config,
                    notifications: {
                      ...config.notifications,
                      slackEnabled: e.target.checked,
                    },
                  })}
                />
              }
              label="Enable Slack Notifications"
            />

            <Divider />

            {/* Recipients */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Notification Recipients ({config.notifications.recipients.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="Email Address"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="admin@example.com"
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddRecipient}
                  disabled={!newRecipient.trim()}
                >
                  Add Recipient
                </Button>
              </Box>
              <List dense>
                {config.notifications.recipients.map((recipient, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={recipient} />
                    <ListItemSecondaryAction>
                      <Tooltip title="Remove recipient">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveRecipient(recipient)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {config.notifications.recipients.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No recipients configured"
                      secondary="Add email addresses to receive security notifications"
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={updateConfigMutation.isPending || isLoading}
        >
          {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SecurityConfigurationDialog;