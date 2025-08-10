import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Divider,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Webhook as WebhookIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testingService } from '../../services/testingService';
import { TestSchedule, TestSuite, NotificationConfig } from '../../types/testing';

export function TestScheduler() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TestSchedule | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    suiteId: '',
    cronExpression: '0 9 * * 1-5', // 9 AM weekdays
    environment: 'development',
    notifications: [] as NotificationConfig[],
    isActive: true,
  });

  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['test-schedules'],
    queryFn: testingService.getTestSchedules,
  });

  const { data: testSuites = [] } = useQuery({
    queryKey: ['test-suites'],
    queryFn: testingService.getTestSuites,
  });

  const createScheduleMutation = useMutation({
    mutationFn: testingService.createTestSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-schedules'] });
      setShowCreateDialog(false);
      setNewSchedule({
        name: '',
        suiteId: '',
        cronExpression: '0 9 * * 1-5',
        environment: 'development',
        notifications: [],
        isActive: true,
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, schedule }: { id: string; schedule: Partial<TestSchedule> }) =>
      testingService.updateTestSchedule(id, schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-schedules'] });
      setShowEditDialog(false);
      setEditingSchedule(null);
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: testingService.deleteTestSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-schedules'] });
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      testingService.toggleTestSchedule(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-schedules'] });
    },
  });

  const handleCreateSchedule = () => {
    createScheduleMutation.mutate(newSchedule as any);
  };

  const handleEditSchedule = (schedule: TestSchedule) => {
    setEditingSchedule(schedule);
    setShowEditDialog(true);
  };

  const handleUpdateSchedule = () => {
    if (editingSchedule) {
      updateScheduleMutation.mutate({
        id: editingSchedule.id,
        schedule: editingSchedule,
      });
    }
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteScheduleMutation.mutate(scheduleId);
    }
  };

  const handleToggleSchedule = (schedule: TestSchedule) => {
    toggleScheduleMutation.mutate({
      id: schedule.id,
      isActive: !schedule.isActive,
    });
  };

  const addNotification = (notifications: NotificationConfig[], setNotifications: (notifications: NotificationConfig[]) => void) => {
    const newNotification: NotificationConfig = {
      type: 'email',
      target: '',
      onSuccess: true,
      onFailure: true,
      onError: true,
    };
    setNotifications([...notifications, newNotification]);
  };

  const updateNotification = (
    notifications: NotificationConfig[],
    setNotifications: (notifications: NotificationConfig[]) => void,
    index: number,
    updates: Partial<NotificationConfig>
  ) => {
    const updated = [...notifications];
    updated[index] = { ...updated[index], ...updates };
    setNotifications(updated);
  };

  const removeNotification = (
    notifications: NotificationConfig[],
    setNotifications: (notifications: NotificationConfig[]) => void,
    index: number
  ) => {
    setNotifications(notifications.filter((_, i) => i !== index));
  };

  const getCronDescription = (cronExpression: string): string => {
    // Simple cron description - in a real app, you'd use a library like cronstrue
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) return 'Invalid cron expression';
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    if (cronExpression === '0 9 * * 1-5') return 'Every weekday at 9:00 AM';
    if (cronExpression === '0 0 * * 0') return 'Every Sunday at midnight';
    if (cronExpression === '0 */6 * * *') return 'Every 6 hours';
    if (cronExpression === '*/30 * * * *') return 'Every 30 minutes';
    
    return `At ${hour}:${minute.padStart(2, '0')}`;
  };

  const getNextRunTime = (cronExpression: string): Date | null => {
    // Simplified next run calculation - in a real app, you'd use a proper cron library
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(nextRun.getHours() + 1); // Simplified: next hour
    return nextRun;
  };

  const getSuiteNameById = (suiteId: string): string => {
    const suite = testSuites.find(s => s.id === suiteId);
    return suite?.name || 'Unknown Suite';
  };

  const renderNotificationConfig = (
    notifications: NotificationConfig[],
    setNotifications: (notifications: NotificationConfig[]) => void,
    readOnly = false
  ) => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2">Notifications</Typography>
        {!readOnly && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => addNotification(notifications, setNotifications)}
          >
            Add Notification
          </Button>
        )}
      </Box>
      
      {notifications.map((notification, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={notification.type}
                    onChange={(e) => updateNotification(notifications, setNotifications, index, { type: e.target.value as any })}
                    label="Type"
                    disabled={readOnly}
                  >
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="webhook">Webhook</MenuItem>
                    <MenuItem value="slack">Slack</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  size="small"
                  label={notification.type === 'email' ? 'Email Address' : 'URL'}
                  value={notification.target}
                  onChange={(e) => updateNotification(notifications, setNotifications, index, { target: e.target.value })}
                  disabled={readOnly}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={notification.onSuccess}
                        onChange={(e) => updateNotification(notifications, setNotifications, index, { onSuccess: e.target.checked })}
                        disabled={readOnly}
                      />
                    }
                    label="Success"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={notification.onFailure}
                        onChange={(e) => updateNotification(notifications, setNotifications, index, { onFailure: e.target.checked })}
                        disabled={readOnly}
                      />
                    }
                    label="Failure"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={1}>
                {!readOnly && (
                  <IconButton
                    size="small"
                    onClick={() => removeNotification(notifications, setNotifications, index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      
      {notifications.length === 0 && (
        <Alert severity="info">
          No notifications configured. Add notifications to get alerts when tests complete.
        </Alert>
      )}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Test Schedules</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create Schedule
        </Button>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2}>
        <AnimatePresence>
          {schedules.map((schedule) => (
            <Grid item xs={12} md={6} lg={4} key={schedule.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3">
                        {schedule.name}
                      </Typography>
                      <Switch
                        checked={schedule.isActive}
                        onChange={() => handleToggleSchedule(schedule)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Suite: {getSuiteNameById(schedule.suiteId)}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Environment: {schedule.environment}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ScheduleIcon fontSize="small" />
                      <Typography variant="body2">
                        {getCronDescription(schedule.cronExpression)}
                      </Typography>
                    </Box>

                    {schedule.nextRun && (
                      <Typography variant="caption" color="text.secondary">
                        Next run: {new Date(schedule.nextRun).toLocaleString()}
                      </Typography>
                    )}

                    {schedule.lastRun && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Last run: {new Date(schedule.lastRun).toLocaleString()}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        label={schedule.isActive ? 'Active' : 'Inactive'}
                        color={schedule.isActive ? 'success' : 'default'}
                      />
                      {schedule.notifications.length > 0 && (
                        <Chip
                          size="small"
                          icon={<NotificationsIcon />}
                          label={`${schedule.notifications.length} notifications`}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditSchedule(schedule)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      color="error"
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>

      {schedules.length === 0 && !isLoading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No test schedules configured. Create a schedule to run tests automatically.
        </Alert>
      )}

      {/* Create Schedule Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Test Schedule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Schedule Name"
                value={newSchedule.name}
                onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Test Suite</InputLabel>
                <Select
                  value={newSchedule.suiteId}
                  onChange={(e) => setNewSchedule({ ...newSchedule, suiteId: e.target.value })}
                  label="Test Suite"
                >
                  {testSuites.map((suite) => (
                    <MenuItem key={suite.id} value={suite.id}>
                      {suite.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cron Expression"
                value={newSchedule.cronExpression}
                onChange={(e) => setNewSchedule({ ...newSchedule, cronExpression: e.target.value })}
                helperText={getCronDescription(newSchedule.cronExpression)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={newSchedule.environment}
                  onChange={(e) => setNewSchedule({ ...newSchedule, environment: e.target.value })}
                  label="Environment"
                >
                  <MenuItem value="development">Development</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newSchedule.isActive}
                    onChange={(e) => setNewSchedule({ ...newSchedule, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              {renderNotificationConfig(
                newSchedule.notifications,
                (notifications) => setNewSchedule({ ...newSchedule, notifications })
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateSchedule} 
            variant="contained"
            disabled={!newSchedule.name || !newSchedule.suiteId || createScheduleMutation.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Test Schedule</DialogTitle>
        <DialogContent>
          {editingSchedule && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Schedule Name"
                  value={editingSchedule.name}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Test Suite</InputLabel>
                  <Select
                    value={editingSchedule.suiteId}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, suiteId: e.target.value })}
                    label="Test Suite"
                  >
                    {testSuites.map((suite) => (
                      <MenuItem key={suite.id} value={suite.id}>
                        {suite.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cron Expression"
                  value={editingSchedule.cronExpression}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, cronExpression: e.target.value })}
                  helperText={getCronDescription(editingSchedule.cronExpression)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Environment</InputLabel>
                  <Select
                    value={editingSchedule.environment}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, environment: e.target.value })}
                    label="Environment"
                  >
                    <MenuItem value="development">Development</MenuItem>
                    <MenuItem value="staging">Staging</MenuItem>
                    <MenuItem value="production">Production</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingSchedule.isActive}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
              <Grid item xs={12}>
                {renderNotificationConfig(
                  editingSchedule.notifications,
                  (notifications) => setEditingSchedule({ ...editingSchedule, notifications })
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateSchedule} 
            variant="contained"
            disabled={!editingSchedule?.name || !editingSchedule?.suiteId || updateScheduleMutation.isPending}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}