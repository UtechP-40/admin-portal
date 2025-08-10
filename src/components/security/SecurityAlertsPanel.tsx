import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Collapse,
  Tooltip,
  Badge,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { securityService } from '../../services/securityService';
import { SecurityAlert, SecuritySeverity } from '../../types/security';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types/permissions';

interface SecurityAlertsPanelProps {
  alerts: SecurityAlert[];
  expanded?: boolean;
}

const SecurityAlertsPanel: React.FC<SecurityAlertsPanelProps> = ({ alerts, expanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');

  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManageSecurity = hasPermission(Permission.SECURITY_MANAGE);

  // Mutations
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (id: string) => securityService.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security'] });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      securityService.resolveAlert(id, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security'] });
      setResolveDialogOpen(false);
      setResolution('');
      setSelectedAlert(null);
    },
  });

  const getSeverityIcon = (severity: SecuritySeverity) => {
    switch (severity) {
      case SecuritySeverity.CRITICAL:
        return <ErrorIcon color="error" />;
      case SecuritySeverity.HIGH:
        return <WarningIcon color="warning" />;
      case SecuritySeverity.MEDIUM:
        return <InfoIcon color="info" />;
      case SecuritySeverity.LOW:
        return <CheckCircleIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };

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

  const activeAlerts = alerts.filter(alert => alert.isActive);
  const resolvedAlerts = alerts.filter(alert => !alert.isActive);

  const handleViewDetails = (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    setDetailsDialogOpen(true);
  };

  const handleResolveAlert = (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    setResolveDialogOpen(true);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeAlertMutation.mutate(alertId);
  };

  const handleSubmitResolution = () => {
    if (selectedAlert && resolution.trim()) {
      resolveAlertMutation.mutate({
        id: selectedAlert.id,
        resolution: resolution.trim(),
      });
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={
          <Badge badgeContent={activeAlerts.length} color="error">
            <NotificationsIcon />
          </Badge>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Security Alerts</Typography>
            {activeAlerts.length > 0 && (
              <Chip
                label={`${activeAlerts.length} Active`}
                color="error"
                size="small"
              />
            )}
          </Box>
        }
        action={
          <Tooltip title={isExpanded ? 'Collapse' : 'Expand'}>
            <IconButton onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {activeAlerts.length === 0 ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              No active security alerts. System is operating normally.
            </Typography>
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {activeAlerts.length} active security alert{activeAlerts.length !== 1 ? 's' : ''} require{activeAlerts.length === 1 ? 's' : ''} attention.
            </Typography>
          </Alert>
        )}

        {/* Active Alerts */}
        <List dense>
          <AnimatePresence>
            {activeAlerts.slice(0, isExpanded ? undefined : 3).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ListItem
                  sx={{
                    border: 1,
                    borderColor: `${getSeverityColor(alert.severity)}.main`,
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: `${getSeverityColor(alert.severity)}.light`,
                    '&:hover': {
                      backgroundColor: `${getSeverityColor(alert.severity)}.light`,
                    },
                  }}
                >
                  <ListItemIcon>
                    {getSeverityIcon(alert.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {alert.title}
                        </Typography>
                        <Chip
                          label={alert.severity.toUpperCase()}
                          size="small"
                          color={getSeverityColor(alert.severity)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {alert.description}
                        </Typography>
                        {alert.triggeredAt && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Triggered: {format(new Date(alert.triggeredAt), 'PPp')}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          <Chip
                            label={`Threshold: ${alert.threshold}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`Current: ${alert.currentValue}`}
                            size="small"
                            variant="outlined"
                            color={alert.currentValue > alert.threshold ? 'error' : 'default'}
                          />
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(alert)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canManageSecurity && (
                        <>
                          <Tooltip title="Acknowledge">
                            <IconButton
                              size="small"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              disabled={acknowledgeAlertMutation.isPending}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Resolve">
                            <IconButton
                              size="small"
                              onClick={() => handleResolveAlert(alert)}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>

        {!isExpanded && activeAlerts.length > 3 && (
          <Button
            variant="text"
            size="small"
            onClick={() => setIsExpanded(true)}
            sx={{ mt: 1 }}
          >
            View {activeAlerts.length - 3} more alerts
          </Button>
        )}

        {/* Resolved Alerts (only when expanded) */}
        <Collapse in={isExpanded && resolvedAlerts.length > 0}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Recently Resolved ({resolvedAlerts.length})
            </Typography>
            <List dense>
              {resolvedAlerts.slice(0, 5).map((alert) => (
                <ListItem key={alert.id} sx={{ opacity: 0.7 }}>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {alert.title}
                      </Typography>
                    }
                    secondary={
                      alert.resolvedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Resolved: {format(new Date(alert.resolvedAt), 'PPp')}
                        </Typography>
                      )
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(alert)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        </Collapse>

        {/* Alert Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Alert Details</DialogTitle>
          <DialogContent>
            {selectedAlert && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Alert ID"
                    value={selectedAlert.id}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                  <TextField
                    label="Type"
                    value={selectedAlert.type}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                  <TextField
                    label="Severity"
                    value={selectedAlert.severity}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                  <TextField
                    label="Status"
                    value={selectedAlert.isActive ? 'Active' : 'Resolved'}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                  <TextField
                    label="Threshold"
                    value={selectedAlert.threshold}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                  <TextField
                    label="Current Value"
                    value={selectedAlert.currentValue}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Box>
                <TextField
                  label="Title"
                  value={selectedAlert.title}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={selectedAlert.description}
                  InputProps={{ readOnly: true }}
                  multiline
                  rows={3}
                  fullWidth
                />
                {selectedAlert.triggeredAt && (
                  <TextField
                    label="Triggered At"
                    value={format(new Date(selectedAlert.triggeredAt), 'PPpp')}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                )}
                {selectedAlert.resolvedAt && (
                  <TextField
                    label="Resolved At"
                    value={format(new Date(selectedAlert.resolvedAt), 'PPpp')}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                )}
                {selectedAlert.conditions.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Conditions
                    </Typography>
                    <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                      {JSON.stringify(selectedAlert.conditions, null, 2)}
                    </pre>
                  </Box>
                )}
                {selectedAlert.actions.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Actions
                    </Typography>
                    <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                      {JSON.stringify(selectedAlert.actions, null, 2)}
                    </pre>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Resolve Alert Dialog */}
        <Dialog
          open={resolveDialogOpen}
          onClose={() => setResolveDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Resolve Alert</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              {selectedAlert && (
                <Alert severity="info">
                  <Typography variant="body2">
                    Resolving alert: <strong>{selectedAlert.title}</strong>
                  </Typography>
                </Alert>
              )}
              <TextField
                label="Resolution Notes"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                multiline
                rows={4}
                fullWidth
                placeholder="Describe how this alert was resolved..."
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitResolution}
              variant="contained"
              disabled={!resolution.trim() || resolveAlertMutation.isPending}
            >
              {resolveAlertMutation.isPending ? 'Resolving...' : 'Resolve Alert'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SecurityAlertsPanel;