import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Button,
  Divider,
  Alert,
  Snackbar,
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
  Tooltip,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  Warning,
  Error,
  Info,
  CheckCircle,
  Close,
  Settings,
  VolumeOff,
  VolumeUp,
  Clear,
  FilterList,
} from '@mui/icons-material';
import { useRealtimeMetrics } from '../../hooks/useRealtimeMetrics';
import { MetricAlert } from '../../services/websocketService';

export interface AlertNotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  severityFilter: ('low' | 'medium' | 'high' | 'critical')[];
  autoHide: boolean;
  autoHideDelay: number; // in seconds
}

export interface AlertNotificationSystemProps {
  onAlertClick?: (alert: MetricAlert) => void;
  maxVisibleAlerts?: number;
}

const DEFAULT_SETTINGS: AlertNotificationSettings = {
  enabled: true,
  soundEnabled: true,
  desktopNotifications: true,
  emailNotifications: false,
  severityFilter: ['medium', 'high', 'critical'],
  autoHide: false,
  autoHideDelay: 10,
};

const AlertNotificationSystem: React.FC<AlertNotificationSystemProps> = ({
  onAlertClick,
  maxVisibleAlerts = 5,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AlertNotificationSettings>(DEFAULT_SETTINGS);
  const [visibleAlerts, setVisibleAlerts] = useState<MetricAlert[]>([]);
  const [snackbarAlert, setSnackbarAlert] = useState<MetricAlert | null>(null);
  const [mutedUntil, setMutedUntil] = useState<Date | null>(null);

  const { alerts, dismissAlert, clearAlerts } = useRealtimeMetrics();

  // Filter alerts based on settings
  const filteredAlerts = alerts.filter(alert =>
    settings.enabled && settings.severityFilter.includes(alert.severity)
  );

  // Handle new alerts
  useEffect(() => {
    if (filteredAlerts.length === 0) return;

    const newAlerts = filteredAlerts.filter(alert =>
      !visibleAlerts.some(visible => visible.id === alert.id)
    );

    if (newAlerts.length > 0) {
      const latestAlert = newAlerts[0];
      
      // Show snackbar for new alert
      if (!snackbarAlert) {
        setSnackbarAlert(latestAlert);
      }

      // Play sound if enabled and not muted
      if (settings.soundEnabled && (!mutedUntil || new Date() > mutedUntil)) {
        playAlertSound(latestAlert.severity);
      }

      // Show desktop notification if enabled
      if (settings.desktopNotifications && 'Notification' in window) {
        showDesktopNotification(latestAlert);
      }

      // Update visible alerts
      setVisibleAlerts(prev => [
        ...newAlerts.slice(0, maxVisibleAlerts),
        ...prev.slice(0, maxVisibleAlerts - newAlerts.length),
      ]);
    }
  }, [filteredAlerts, visibleAlerts, snackbarAlert, settings, mutedUntil, maxVisibleAlerts]);

  // Auto-hide alerts
  useEffect(() => {
    if (!settings.autoHide || visibleAlerts.length === 0) return;

    const timer = setTimeout(() => {
      setVisibleAlerts([]);
    }, settings.autoHideDelay * 1000);

    return () => clearTimeout(timer);
  }, [visibleAlerts, settings.autoHide, settings.autoHideDelay]);

  // Request desktop notification permission
  useEffect(() => {
    if (settings.desktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings.desktopNotifications]);

  const playAlertSound = useCallback((severity: string) => {
    try {
      const audio = new Audio();
      switch (severity) {
        case 'critical':
          audio.src = '/sounds/alert-critical.mp3';
          break;
        case 'high':
          audio.src = '/sounds/alert-high.mp3';
          break;
        case 'medium':
          audio.src = '/sounds/alert-medium.mp3';
          break;
        default:
          audio.src = '/sounds/alert-low.mp3';
      }
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Failed to play alert sound:', error);
    }
  }, []);

  const showDesktopNotification = useCallback((alert: MetricAlert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`Alert: ${alert.ruleName}`, {
        body: alert.message,
        icon: '/icons/alert.png',
        tag: alert.id,
        requireInteraction: alert.severity === 'critical',
      });

      notification.onclick = () => {
        window.focus();
        onAlertClick?.(alert);
        notification.close();
      };

      // Auto-close after 10 seconds for non-critical alerts
      if (alert.severity !== 'critical') {
        setTimeout(() => notification.close(), 10000);
      }
    }
  }, [onAlertClick]);

  const handleMuteTemporary = (minutes: number) => {
    setMutedUntil(new Date(Date.now() + minutes * 60 * 1000));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Error color="error" />;
      case 'high':
        return <Warning color="warning" />;
      case 'medium':
        return <Info color="info" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'success';
    }
  };

  const unreadCount = filteredAlerts.length;
  const isMuted = mutedUntil && new Date() < mutedUntil;

  return (
    <>
      {/* Alert Bell Icon */}
      <Tooltip title={isMuted ? 'Notifications muted' : `${unreadCount} alerts`}>
        <IconButton
          color="inherit"
          onClick={() => setDrawerOpen(true)}
          sx={{
            position: 'relative',
            color: isMuted ? 'text.disabled' : 'inherit',
          }}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            {isMuted ? <VolumeOff /> : unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Alert Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 400 } }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Alerts ({filteredAlerts.length})
            </Typography>
            <Box>
              <IconButton size="small" onClick={() => setSettingsOpen(true)}>
                <Settings />
              </IconButton>
              <IconButton size="small" onClick={() => setDrawerOpen(false)}>
                <Close />
              </IconButton>
            </Box>
          </Box>
          
          {/* Quick Actions */}
          <Box display="flex" gap={1} mt={2}>
            <Button
              size="small"
              variant="outlined"
              onClick={clearAlerts}
              disabled={filteredAlerts.length === 0}
            >
              Clear All
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleMuteTemporary(15)}
              startIcon={isMuted ? <VolumeUp /> : <VolumeOff />}
            >
              {isMuted ? 'Unmute' : 'Mute 15m'}
            </Button>
          </Box>

          {isMuted && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Notifications muted until {mutedUntil?.toLocaleTimeString()}
            </Alert>
          )}
        </Box>

        {/* Alert List */}
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {filteredAlerts.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No alerts"
                secondary="All systems are running normally"
              />
            </ListItem>
          ) : (
            filteredAlerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                <ListItem
                  button
                  onClick={() => {
                    onAlertClick?.(alert);
                    setDrawerOpen(false);
                  }}
                >
                  <ListItemIcon>
                    {getSeverityIcon(alert.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {alert.ruleName}
                        </Typography>
                        <Chip
                          label={alert.severity}
                          size="small"
                          color={getSeverityColor(alert.severity) as any}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissAlert(alert.id);
                      }}
                    >
                      <Close />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredAlerts.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </List>
      </Drawer>

      {/* Snackbar Alert */}
      <Snackbar
        open={!!snackbarAlert}
        autoHideDuration={settings.autoHide ? settings.autoHideDelay * 1000 : null}
        onClose={() => setSnackbarAlert(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {snackbarAlert && (
          <Alert
            severity={getSeverityColor(snackbarAlert.severity) as any}
            onClose={() => setSnackbarAlert(null)}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  onAlertClick?.(snackbarAlert);
                  setSnackbarAlert(null);
                }}
              >
                View
              </Button>
            }
          >
            <Typography variant="body2" fontWeight="medium">
              {snackbarAlert.ruleName}
            </Typography>
            <Typography variant="body2">
              {snackbarAlert.message}
            </Typography>
          </Alert>
        )}
      </Snackbar>

      {/* Settings Dialog */}
      <AlertSettingsDialog
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(newSettings) => {
          setSettings(newSettings);
          setSettingsOpen(false);
        }}
      />
    </>
  );
};

// Alert Settings Dialog Component
interface AlertSettingsDialogProps {
  open: boolean;
  settings: AlertNotificationSettings;
  onClose: () => void;
  onSave: (settings: AlertNotificationSettings) => void;
}

const AlertSettingsDialog: React.FC<AlertSettingsDialogProps> = ({
  open,
  settings,
  onClose,
  onSave,
}) => {
  const [tempSettings, setTempSettings] = useState(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(tempSettings);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Alert Notification Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={tempSettings.enabled}
                onChange={(e) =>
                  setTempSettings({ ...tempSettings, enabled: e.target.checked })
                }
              />
            }
            label="Enable Alert Notifications"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={tempSettings.soundEnabled}
                onChange={(e) =>
                  setTempSettings({ ...tempSettings, soundEnabled: e.target.checked })
                }
                disabled={!tempSettings.enabled}
              />
            }
            label="Sound Notifications"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={tempSettings.desktopNotifications}
                onChange={(e) =>
                  setTempSettings({ ...tempSettings, desktopNotifications: e.target.checked })
                }
                disabled={!tempSettings.enabled}
              />
            }
            label="Desktop Notifications"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={tempSettings.autoHide}
                onChange={(e) =>
                  setTempSettings({ ...tempSettings, autoHide: e.target.checked })
                }
                disabled={!tempSettings.enabled}
              />
            }
            label="Auto-hide Alerts"
          />

          {tempSettings.autoHide && (
            <TextField
              fullWidth
              type="number"
              label="Auto-hide Delay (seconds)"
              value={tempSettings.autoHideDelay}
              onChange={(e) =>
                setTempSettings({
                  ...tempSettings,
                  autoHideDelay: parseInt(e.target.value) || 10,
                })
              }
              sx={{ mt: 2 }}
            />
          )}

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Severity Filter</InputLabel>
            <Select
              multiple
              value={tempSettings.severityFilter}
              label="Severity Filter"
              onChange={(e) =>
                setTempSettings({
                  ...tempSettings,
                  severityFilter: e.target.value as any,
                })
              }
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertNotificationSystem;