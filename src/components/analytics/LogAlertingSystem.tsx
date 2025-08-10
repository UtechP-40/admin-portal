import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
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
  Chip,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  Slider,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Notifications,
  NotificationsActive,
  Warning,
  Error,
  Info,
  CheckCircle,
  ExpandMore,
  Timeline,
  TrendingUp,
  Email,
  Webhook,
  Sms,
  Settings,
  History,
  Analytics,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { analyticsService, LogEntry } from '../../services/analytics';

export interface LogAlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  query: string;
  conditions: {
    threshold: number;
    timeWindow: number; // minutes
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
    aggregation: 'count' | 'rate' | 'avg' | 'sum' | 'min' | 'max';
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  notifications: {
    channels: ('email' | 'webhook' | 'sms' | 'slack')[];
    recipients: string[];
    webhookUrl?: string;
    slackChannel?: string;
    cooldownMinutes: number;
  };
  schedule?: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    days: number[]; // 0-6, Sunday-Saturday
  };
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface LogAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  query: string;
  matchingLogs: LogEntry[];
  value: number;
  threshold: number;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  notificationsSent: {
    channel: string;
    sentAt: Date;
    success: boolean;
    error?: string;
  }[];
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
      id={`log-alerts-tabpanel-${index}`}
      aria-labelledby={`log-alerts-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SAMPLE_QUERIES = [
  'level:error',
  'level:error AND message:"database"',
  'level:warn AND source:backend',
  'message:"authentication failed"',
  'level:error AND NOT message:"expected"',
  'category:security AND level:warn',
];

const NOTIFICATION_CHANNELS = [
  { value: 'email', label: 'Email', icon: <Email /> },
  { value: 'webhook', label: 'Webhook', icon: <Webhook /> },
  { value: 'sms', label: 'SMS', icon: <Sms /> },
  { value: 'slack', label: 'Slack', icon: <Notifications /> },
];

export interface LogAlertingSystemProps {
  onAlertTriggered?: (alert: LogAlert) => void;
  onRuleUpdated?: (rule: LogAlertRule) => void;
}

const LogAlertingSystem: React.FC<LogAlertingSystemProps> = ({
  onAlertTriggered,
  onRuleUpdated,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [rules, setRules] = useState<LogAlertRule[]>([]);
  const [alerts, setAlerts] = useState<LogAlert[]>([]);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LogAlertRule | null>(null);
  const [testingRule, setTestingRule] = useState<LogAlertRule | null>(null);
  const [testResults, setTestResults] = useState<{ logs: LogEntry[]; value: number } | null>(null);

  // Load rules and alerts on component mount
  useEffect(() => {
    loadRules();
    loadAlerts();
  }, []);

  // Set up rule evaluation interval
  useEffect(() => {
    const interval = setInterval(() => {
      evaluateRules();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [rules]);

  const loadRules = async () => {
    try {
      const loadedRules = await analyticsService.getAlertRules();
      setRules(loadedRules);
    } catch (error) {
      console.error('Failed to load alert rules:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      // In a real implementation, this would load recent alerts
      // For now, we'll use mock data
      setAlerts([]);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const evaluateRules = async () => {
    const activeRules = rules.filter(rule => rule.enabled);
    
    for (const rule of activeRules) {
      try {
        // Check if rule is within schedule
        if (rule.schedule?.enabled && !isWithinSchedule(rule.schedule)) {
          continue;
        }

        // Check cooldown
        if (rule.lastTriggered && isInCooldown(rule)) {
          continue;
        }

        // Execute query
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - rule.conditions.timeWindow * 60 * 1000);
        
        const logs = await analyticsService.searchLogs(rule.query, {
          startTime,
          endTime,
          maxLines: 10000,
        });

        // Calculate value based on aggregation
        const value = calculateAggregation(logs, rule.conditions.aggregation);

        // Check if threshold is met
        if (evaluateCondition(value, rule.conditions.threshold, rule.conditions.operator)) {
          await triggerAlert(rule, logs, value);
        }

      } catch (error) {
        console.error(`Failed to evaluate rule ${rule.id}:`, error);
      }
    }
  };

  const isWithinSchedule = (schedule: NonNullable<LogAlertRule['schedule']>) => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    if (!schedule.days.includes(currentDay)) {
      return false;
    }

    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  };

  const isInCooldown = (rule: LogAlertRule) => {
    if (!rule.lastTriggered) return false;
    
    const cooldownMs = rule.notifications.cooldownMinutes * 60 * 1000;
    return Date.now() - rule.lastTriggered.getTime() < cooldownMs;
  };

  const calculateAggregation = (logs: LogEntry[], aggregation: string) => {
    switch (aggregation) {
      case 'count':
        return logs.length;
      case 'rate':
        return logs.length / 60; // per minute
      case 'avg':
        // For demo purposes, assume logs have a numeric value in metadata
        const values = logs.map(log => Number(log.metadata?.value || 0)).filter(v => !isNaN(v));
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'sum':
        return logs.map(log => Number(log.metadata?.value || 0)).reduce((a, b) => a + b, 0);
      case 'min':
        const minValues = logs.map(log => Number(log.metadata?.value || 0)).filter(v => !isNaN(v));
        return minValues.length > 0 ? Math.min(...minValues) : 0;
      case 'max':
        const maxValues = logs.map(log => Number(log.metadata?.value || 0)).filter(v => !isNaN(v));
        return maxValues.length > 0 ? Math.max(...maxValues) : 0;
      default:
        return logs.length;
    }
  };

  const evaluateCondition = (value: number, threshold: number, operator: string) => {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  };

  const triggerAlert = async (rule: LogAlertRule, matchingLogs: LogEntry[], value: number) => {
    const alert: LogAlert = {
      id: `alert_${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: `Alert: ${rule.name} - ${rule.conditions.aggregation}(${value}) ${rule.conditions.operator} ${rule.conditions.threshold}`,
      query: rule.query,
      matchingLogs: matchingLogs.slice(0, 10), // Limit to first 10 logs
      value,
      threshold: rule.conditions.threshold,
      triggeredAt: new Date(),
      acknowledged: false,
      resolved: false,
      notificationsSent: [],
    };

    // Add to alerts list
    setAlerts(prev => [alert, ...prev]);

    // Update rule trigger count and last triggered
    const updatedRule = {
      ...rule,
      lastTriggered: new Date(),
      triggerCount: rule.triggerCount + 1,
    };
    setRules(prev => prev.map(r => r.id === rule.id ? updatedRule : r));

    // Send notifications
    await sendNotifications(alert, rule);

    // Notify parent component
    onAlertTriggered?.(alert);
  };

  const sendNotifications = async (alert: LogAlert, rule: LogAlertRule) => {
    const notifications: LogAlert['notificationsSent'] = [];

    for (const channel of rule.notifications.channels) {
      try {
        let success = false;
        let error: string | undefined;

        switch (channel) {
          case 'email':
            success = await sendEmailNotification(alert, rule.notifications.recipients);
            break;
          case 'webhook':
            if (rule.notifications.webhookUrl) {
              success = await sendWebhookNotification(alert, rule.notifications.webhookUrl);
            }
            break;
          case 'sms':
            success = await sendSmsNotification(alert, rule.notifications.recipients);
            break;
          case 'slack':
            if (rule.notifications.slackChannel) {
              success = await sendSlackNotification(alert, rule.notifications.slackChannel);
            }
            break;
        }

        notifications.push({
          channel,
          sentAt: new Date(),
          success,
          error,
        });

      } catch (err) {
        notifications.push({
          channel,
          sentAt: new Date(),
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Update alert with notification results
    setAlerts(prev => prev.map(a => 
      a.id === alert.id ? { ...a, notificationsSent: notifications } : a
    ));
  };

  const sendEmailNotification = async (alert: LogAlert, recipients: string[]) => {
    // Mock email sending
    console.log('Sending email notification:', { alert, recipients });
    return true;
  };

  const sendWebhookNotification = async (alert: LogAlert, webhookUrl: string) => {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
      return response.ok;
    } catch (error) {
      console.error('Webhook notification failed:', error);
      return false;
    }
  };

  const sendSmsNotification = async (alert: LogAlert, recipients: string[]) => {
    // Mock SMS sending
    console.log('Sending SMS notification:', { alert, recipients });
    return true;
  };

  const sendSlackNotification = async (alert: LogAlert, channel: string) => {
    // Mock Slack notification
    console.log('Sending Slack notification:', { alert, channel });
    return true;
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule: LogAlertRule) => {
    setEditingRule(rule);
    setRuleDialogOpen(true);
  };

  const handleSaveRule = async (rule: Omit<LogAlertRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>) => {
    try {
      if (editingRule) {
        // Update existing rule
        const updatedRule: LogAlertRule = {
          ...editingRule,
          ...rule,
          updatedAt: new Date(),
        };
        
        await analyticsService.updateAlertRule(editingRule.id, updatedRule);
        setRules(prev => prev.map(r => r.id === editingRule.id ? updatedRule : r));
        onRuleUpdated?.(updatedRule);
      } else {
        // Create new rule
        const newRule: LogAlertRule = {
          ...rule,
          id: `rule_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          triggerCount: 0,
        };
        
        await analyticsService.createAlertRule(newRule);
        setRules(prev => [...prev, newRule]);
        onRuleUpdated?.(newRule);
      }
      
      setRuleDialogOpen(false);
      setEditingRule(null);
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await analyticsService.deleteAlertRule(ruleId);
      setRules(prev => prev.filter(r => r.id !== ruleId));
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleTestRule = async (rule: LogAlertRule) => {
    setTestingRule(rule);
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - rule.conditions.timeWindow * 60 * 1000);
      
      const logs = await analyticsService.searchLogs(rule.query, {
        startTime,
        endTime,
        maxLines: 100,
      });

      const value = calculateAggregation(logs, rule.conditions.aggregation);
      setTestResults({ logs, value });
    } catch (error) {
      console.error('Failed to test rule:', error);
      setTestResults(null);
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            acknowledged: true, 
            acknowledgedAt: new Date(),
            acknowledgedBy: 'current_user' // In real app, get from auth context
          }
        : alert
    ));
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, resolved: true, resolvedAt: new Date() }
        : alert
    ));
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

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged && !alert.resolved);
  const activeRules = rules.filter(rule => rule.enabled);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">
            Log Alerting System
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Badge badgeContent={unacknowledgedAlerts.length} color="error">
              <NotificationsActive />
            </Badge>
            <Typography variant="body2" color="text.secondary">
              {activeRules.length} active rules
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Notifications />
                    Active Alerts
                    <Badge badgeContent={unacknowledgedAlerts.length} color="error" />
                  </Box>
                }
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Settings />
                    Alert Rules
                    <Badge badgeContent={activeRules.length} color="primary" />
                  </Box>
                }
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <History />
                    Alert History
                  </Box>
                }
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Analytics />
                    Analytics
                  </Box>
                }
              />
            </Tabs>
          </Box>

          {/* Active Alerts Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {unacknowledgedAlerts.map((alert) => (
                <Grid item xs={12} key={alert.id}>
                  <Card sx={{ border: `2px solid ${getSeverityColor(alert.severity)}` }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                          {getSeverityIcon(alert.severity)}
                          <Box>
                            <Typography variant="h6">{alert.ruleName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Triggered: {alert.triggeredAt.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={alert.severity.toUpperCase()}
                          color={getSeverityColor(alert.severity) as any}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body1" gutterBottom>
                        {alert.message}
                      </Typography>
                      
                      <Box display="flex" gap={2} mb={2}>
                        <Typography variant="body2">
                          <strong>Value:</strong> {alert.value}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Threshold:</strong> {alert.threshold}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Matching Logs:</strong> {alert.matchingLogs.length}
                        </Typography>
                      </Box>

                      {alert.matchingLogs.length > 0 && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle2">
                              View Matching Logs ({alert.matchingLogs.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {alert.matchingLogs.slice(0, 5).map((log, index) => (
                                <ListItem key={index}>
                                  <ListItemText
                                    primary={log.message}
                                    secondary={`${log.level} - ${new Date(log.timestamp).toLocaleString()}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        disabled={alert.acknowledged}
                      >
                        {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleResolveAlert(alert.id)}
                        disabled={alert.resolved}
                      >
                        {alert.resolved ? 'Resolved' : 'Resolve'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              
              {unacknowledgedAlerts.length === 0 && (
                <Grid item xs={12}>
                  <Box textAlign="center" py={4}>
                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No Active Alerts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All alerts have been acknowledged or resolved.
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          {/* Alert Rules Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Alert Rules</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateRule}
              >
                Create Rule
              </Button>
            </Box>

            <Grid container spacing={3}>
              {rules.map((rule) => (
                <Grid item xs={12} md={6} key={rule.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <Box>
                          <Typography variant="h6">{rule.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {rule.description}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={rule.severity.toUpperCase()}
                            color={getSeverityColor(rule.severity) as any}
                            size="small"
                          />
                          <Switch
                            checked={rule.enabled}
                            onChange={(e) => {
                              const updatedRule = { ...rule, enabled: e.target.checked };
                              setRules(prev => prev.map(r => r.id === rule.id ? updatedRule : r));
                              analyticsService.updateAlertRule(rule.id, updatedRule);
                            }}
                            size="small"
                          />
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                        {rule.query}
                      </Typography>
                      
                      <Box display="flex" gap={2} mb={2}>
                        <Typography variant="caption">
                          Threshold: {rule.conditions.aggregation}({rule.conditions.operator} {rule.conditions.threshold})
                        </Typography>
                        <Typography variant="caption">
                          Window: {rule.conditions.timeWindow}m
                        </Typography>
                        <Typography variant="caption">
                          Triggered: {rule.triggerCount} times
                        </Typography>
                      </Box>

                      <Box display="flex" gap={1} flexWrap="wrap">
                        {rule.notifications.channels.map((channel) => {
                          const channelInfo = NOTIFICATION_CHANNELS.find(c => c.value === channel);
                          return (
                            <Chip
                              key={channel}
                              icon={channelInfo?.icon}
                              label={channelInfo?.label}
                              size="small"
                              variant="outlined"
                            />
                          );
                        })}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => handleTestRule(rule)}
                      >
                        Test
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditRule(rule)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Delete />}
                        color="error"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {rules.length === 0 && (
              <Box textAlign="center" py={4}>
                <Warning sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Alert Rules Configured
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Create alert rules to monitor your logs and get notified of important events.
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={handleCreateRule}>
                  Create Your First Rule
                </Button>
              </Box>
            )}
          </TabPanel>

          {/* Alert History Tab */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" gutterBottom>
              Alert History
            </Typography>
            <List>
              {alerts.map((alert) => (
                <ListItem key={alert.id} divider>
                  <ListItemIcon>
                    {getSeverityIcon(alert.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.ruleName}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {alert.message}
                        </Typography>
                        <Typography variant="caption">
                          {alert.triggeredAt.toLocaleString()}
                          {alert.acknowledged && ` • Acknowledged ${alert.acknowledgedAt?.toLocaleString()}`}
                          {alert.resolved && ` • Resolved ${alert.resolvedAt?.toLocaleString()}`}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={alert.resolved ? 'Resolved' : alert.acknowledged ? 'Acknowledged' : 'Active'}
                      color={alert.resolved ? 'success' : alert.acknowledged ? 'info' : 'error'}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6" gutterBottom>
              Alerting Analytics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Total Rules</Typography>
                    <Typography variant="h3">{rules.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activeRules.length} active
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Total Alerts</Typography>
                    <Typography variant="h3">{alerts.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {unacknowledgedAlerts.length} unacknowledged
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Alert Rate</Typography>
                    <Typography variant="h3">
                      {alerts.length > 0 ? (alerts.length / 24).toFixed(1) : '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      alerts per hour
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>

        {/* Rule Dialog */}
        <AlertRuleDialog
          open={ruleDialogOpen}
          rule={editingRule}
          onClose={() => {
            setRuleDialogOpen(false);
            setEditingRule(null);
          }}
          onSave={handleSaveRule}
        />

        {/* Test Results Dialog */}
        <TestResultsDialog
          open={!!testingRule}
          rule={testingRule}
          results={testResults}
          onClose={() => {
            setTestingRule(null);
            setTestResults(null);
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

// Alert Rule Dialog Component
interface AlertRuleDialogProps {
  open: boolean;
  rule: LogAlertRule | null;
  onClose: () => void;
  onSave: (rule: Omit<LogAlertRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>) => void;
}

const AlertRuleDialog: React.FC<AlertRuleDialogProps> = ({
  open,
  rule,
  onClose,
  onSave,
}) => {
  const [ruleData, setRuleData] = useState<Partial<LogAlertRule>>({
    name: '',
    description: '',
    enabled: true,
    query: '',
    conditions: {
      threshold: 10,
      timeWindow: 5,
      operator: 'gt',
      aggregation: 'count',
    },
    severity: 'medium',
    notifications: {
      channels: ['email'],
      recipients: [],
      cooldownMinutes: 15,
    },
  });

  useEffect(() => {
    if (rule) {
      setRuleData(rule);
    } else {
      setRuleData({
        name: '',
        description: '',
        enabled: true,
        query: '',
        conditions: {
          threshold: 10,
          timeWindow: 5,
          operator: 'gt',
          aggregation: 'count',
        },
        severity: 'medium',
        notifications: {
          channels: ['email'],
          recipients: [],
          cooldownMinutes: 15,
        },
      });
    }
  }, [rule]);

  const handleSave = () => {
    if (ruleData.name && ruleData.query && ruleData.conditions && ruleData.notifications) {
      onSave(ruleData as Omit<LogAlertRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{rule ? 'Edit Alert Rule' : 'Create Alert Rule'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Rule Name"
              value={ruleData.name || ''}
              onChange={(e) => setRuleData({ ...ruleData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={ruleData.severity || 'medium'}
                label="Severity"
                onChange={(e) => setRuleData({ ...ruleData, severity: e.target.value as any })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={ruleData.description || ''}
              onChange={(e) => setRuleData({ ...ruleData, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              options={SAMPLE_QUERIES}
              value={ruleData.query || ''}
              onChange={(e, value) => setRuleData({ ...ruleData, query: value || '' })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Log Query"
                  placeholder="Enter log search query..."
                  helperText="Use query language syntax (e.g., level:error AND message:database)"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Aggregation</InputLabel>
              <Select
                value={ruleData.conditions?.aggregation || 'count'}
                label="Aggregation"
                onChange={(e) => setRuleData({
                  ...ruleData,
                  conditions: { ...ruleData.conditions!, aggregation: e.target.value as any }
                })}
              >
                <MenuItem value="count">Count</MenuItem>
                <MenuItem value="rate">Rate</MenuItem>
                <MenuItem value="avg">Average</MenuItem>
                <MenuItem value="sum">Sum</MenuItem>
                <MenuItem value="min">Minimum</MenuItem>
                <MenuItem value="max">Maximum</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Operator</InputLabel>
              <Select
                value={ruleData.conditions?.operator || 'gt'}
                label="Operator"
                onChange={(e) => setRuleData({
                  ...ruleData,
                  conditions: { ...ruleData.conditions!, operator: e.target.value as any }
                })}
              >
                <MenuItem value="gt">Greater Than</MenuItem>
                <MenuItem value="gte">Greater Than or Equal</MenuItem>
                <MenuItem value="lt">Less Than</MenuItem>
                <MenuItem value="lte">Less Than or Equal</MenuItem>
                <MenuItem value="eq">Equal</MenuItem>
                <MenuItem value="ne">Not Equal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="number"
              label="Threshold"
              value={ruleData.conditions?.threshold || 0}
              onChange={(e) => setRuleData({
                ...ruleData,
                conditions: { ...ruleData.conditions!, threshold: parseFloat(e.target.value) || 0 }
              })}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="number"
              label="Time Window (minutes)"
              value={ruleData.conditions?.timeWindow || 5}
              onChange={(e) => setRuleData({
                ...ruleData,
                conditions: { ...ruleData.conditions!, timeWindow: parseInt(e.target.value) || 5 }
              })}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Notification Channels</InputLabel>
              <Select
                multiple
                value={ruleData.notifications?.channels || []}
                label="Notification Channels"
                onChange={(e) => setRuleData({
                  ...ruleData,
                  notifications: { ...ruleData.notifications!, channels: e.target.value as any }
                })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <MenuItem key={channel.value} value={channel.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {channel.icon}
                      {channel.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Recipients (comma-separated)"
              value={ruleData.notifications?.recipients?.join(', ') || ''}
              onChange={(e) => setRuleData({
                ...ruleData,
                notifications: {
                  ...ruleData.notifications!,
                  recipients: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }
              })}
              helperText="Email addresses, phone numbers, or webhook URLs"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Cooldown (minutes)"
              value={ruleData.notifications?.cooldownMinutes || 15}
              onChange={(e) => setRuleData({
                ...ruleData,
                notifications: { ...ruleData.notifications!, cooldownMinutes: parseInt(e.target.value) || 15 }
              })}
              helperText="Minimum time between notifications"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={ruleData.enabled || false}
                  onChange={(e) => setRuleData({ ...ruleData, enabled: e.target.checked })}
                />
              }
              label="Enable Rule"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {rule ? 'Update' : 'Create'} Rule
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Test Results Dialog Component
interface TestResultsDialogProps {
  open: boolean;
  rule: LogAlertRule | null;
  results: { logs: LogEntry[]; value: number } | null;
  onClose: () => void;
}

const TestResultsDialog: React.FC<TestResultsDialogProps> = ({
  open,
  rule,
  results,
  onClose,
}) => {
  if (!rule) return null;

  const wouldTrigger = results ? 
    evaluateCondition(results.value, rule.conditions.threshold, rule.conditions.operator) : 
    false;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Test Results: {rule.name}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">
              Value: {results?.value || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {rule.conditions.aggregation} of matching logs
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">
              Threshold: {rule.conditions.threshold}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {rule.conditions.operator} condition
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Alert severity={wouldTrigger ? 'warning' : 'success'}>
              {wouldTrigger 
                ? 'This rule would trigger an alert with the current data'
                : 'This rule would not trigger an alert with the current data'
              }
            </Alert>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Matching Logs ({results?.logs.length || 0})
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {results?.logs.slice(0, 10).map((log, index) => (
                <Box key={index} sx={{ p: 1, mb: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    [{log.level}] {log.message}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Helper function for condition evaluation (moved outside component)
const evaluateCondition = (value: number, threshold: number, operator: string) => {
  switch (operator) {
    case 'gt': return value > threshold;
    case 'gte': return value >= threshold;
    case 'lt': return value < threshold;
    case 'lte': return value <= threshold;
    case 'eq': return value === threshold;
    case 'ne': return value !== threshold;
    default: return false;
  }
};

export default LogAlertingSystem;