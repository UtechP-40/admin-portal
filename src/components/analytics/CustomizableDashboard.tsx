import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Fab,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Add,
  Dashboard,
  Refresh,
  Settings,
  Download,
  Share,
} from '@mui/icons-material';
import DashboardWidget from './DashboardWidget';
import type { WidgetConfig } from './DashboardWidget';
import { MetricCard } from '../charts';
import { useRealtimeMetrics } from '../../hooks/useRealtimeMetrics';
import { analyticsService } from '../../services/analytics';

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: WidgetConfig[];
  settings: {
    autoRefresh: boolean;
    refreshInterval: number;
    theme: 'light' | 'dark' | 'auto';
    gridSize: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomizableDashboardProps {
  dashboardId?: string;
  initialLayout?: DashboardLayout;
  onSave?: (layout: DashboardLayout) => void;
  onDelete?: (dashboardId: string) => void;
}

const DEFAULT_WIDGET_SIZE = { width: 300, height: 200 };
const GRID_SIZE = 20;

const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  dashboardId,
  initialLayout,
  onSave,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<DashboardLayout>(
    initialLayout || {
      id: dashboardId || `dashboard_${Date.now()}`,
      name: 'New Dashboard',
      description: '',
      widgets: [],
      settings: {
        autoRefresh: true,
        refreshInterval: 30,
        theme: 'auto',
        gridSize: GRID_SIZE,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { metrics, isConnected, refresh, alerts } = useRealtimeMetrics({
    enabled: layout.settings.autoRefresh,
  });

  // Auto-refresh effect
  useEffect(() => {
    if (!layout.settings.autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, layout.settings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [layout.settings.autoRefresh, layout.settings.refreshInterval, refresh]);

  const handleSave = useCallback(async () => {
    try {
      const updatedLayout = { ...layout, updatedAt: new Date() };
      
      if (onSave) {
        onSave(updatedLayout);
      } else {
        await analyticsService.saveDashboard(updatedLayout);
      }

      setLayout(updatedLayout);
      setIsEditing(false);
      setSnackbar({ open: true, message: 'Dashboard saved successfully', severity: 'success' });
    } catch (error) {
      console.error('Failed to save dashboard:', error);
      setSnackbar({ open: true, message: 'Failed to save dashboard', severity: 'error' });
    }
  }, [layout, onSave]);

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to initial layout if available
    if (initialLayout) {
      setLayout(initialLayout);
    }
  };

  const handleAddWidget = (widgetType: string) => {
    const newWidget: WidgetConfig = {
      id: `widget_${Date.now()}`,
      title: `New ${widgetType} Widget`,
      type: widgetType as any,
      position: { x: 0, y: 0 },
      size: DEFAULT_WIDGET_SIZE,
      config: getDefaultWidgetConfig(widgetType),
      refreshInterval: 30,
    };

    setLayout(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }));

    setAddWidgetDialogOpen(false);
  };

  const handleUpdateWidget = (updatedWidget: WidgetConfig) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === updatedWidget.id ? updatedWidget : widget
      ),
    }));
  };

  const handleDeleteWidget = (widgetId: string) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.filter(widget => widget.id !== widgetId),
    }));
  };

  const handleRefreshWidget = (widgetId: string) => {
    // Trigger refresh for specific widget
    refresh();
  };

  const renderWidget = (widget: WidgetConfig) => {
    const widgetData = getWidgetData(widget, metrics);

    return (
      <DashboardWidget
        key={widget.id}
        widget={widget}
        isEditing={isEditing}
        onUpdate={handleUpdateWidget}
        onDelete={handleDeleteWidget}
        onRefresh={handleRefreshWidget}
        loading={!metrics}
        error={widgetData.error}
      >
        {renderWidgetContent(widget, widgetData)}
      </DashboardWidget>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Dashboard Toolbar */}
      <Paper elevation={1}>
        <Toolbar>
          <Dashboard sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {layout.name}
          </Typography>
          
          {/* Connection Status */}
          <Tooltip title={isConnected ? 'Real-time connected' : 'Using fallback polling'}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: isConnected ? 'success.main' : 'warning.main',
                mr: 2,
              }}
            />
          </Tooltip>

          {/* Action Buttons */}
          <IconButton onClick={refresh} disabled={!metrics}>
            <Refresh />
          </IconButton>
          
          <IconButton onClick={() => setSettingsDialogOpen(true)}>
            <Settings />
          </IconButton>

          {isEditing ? (
            <>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                sx={{ ml: 1 }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                sx={{ ml: 1 }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setIsEditing(true)}
              sx={{ ml: 1 }}
            >
              Edit
            </Button>
          )}
        </Toolbar>
      </Paper>

      {/* Dashboard Content */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          bgcolor: 'background.default',
          backgroundImage: isEditing
            ? `radial-gradient(circle, #ccc 1px, transparent 1px)`
            : 'none',
          backgroundSize: isEditing ? `${GRID_SIZE}px ${GRID_SIZE}px` : 'auto',
        }}
      >
        {layout.widgets.map(renderWidget)}

        {/* Add Widget FAB */}
        {isEditing && (
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => setAddWidgetDialogOpen(true)}
          >
            <Add />
          </Fab>
        )}

        {/* Empty State */}
        {layout.widgets.length === 0 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            textAlign="center"
          >
            <Dashboard sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Empty Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              {isEditing
                ? 'Click the + button to add your first widget'
                : 'Switch to edit mode to customize this dashboard'}
            </Typography>
            {!isEditing && (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setIsEditing(true)}
              >
                Start Editing
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Add Widget Dialog */}
      <AddWidgetDialog
        open={addWidgetDialogOpen}
        onClose={() => setAddWidgetDialogOpen(false)}
        onAdd={handleAddWidget}
      />

      {/* Dashboard Settings Dialog */}
      <DashboardSettingsDialog
        open={settingsDialogOpen}
        layout={layout}
        onClose={() => setSettingsDialogOpen(false)}
        onSave={(updatedLayout) => {
          setLayout(updatedLayout);
          setSettingsDialogOpen(false);
        }}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Helper functions
const getDefaultWidgetConfig = (widgetType: string): Record<string, any> => {
  switch (widgetType) {
    case 'metric':
      return {
        metric: 'totalEvents',
        format: 'number',
        color: '#1976d2',
        icon: 'TrendingUp',
      };
    case 'chart':
      return {
        chartType: 'line',
        dataSource: 'metrics',
        xAxis: 'timestamp',
        yAxis: 'value',
      };
    case 'table':
      return {
        dataSource: 'logs',
        columns: ['timestamp', 'level', 'message'],
        pageSize: 10,
      };
    default:
      return {};
  }
};

const getWidgetData = (widget: WidgetConfig, metrics: any) => {
  // This would be expanded to handle different widget types and data sources
  return {
    data: metrics,
    error: null,
  };
};

const renderWidgetContent = (widget: WidgetConfig, widgetData: any) => {
  switch (widget.type) {
    case 'metric':
      return (
        <MetricCard
          title={widget.title}
          value={widgetData.data?.overview?.[widget.config.metric] || 0}
          color={widget.config.color}
          loading={!widgetData.data}
        />
      );
    case 'chart':
      // Would render appropriate chart component
      return <Box p={2}>Chart widget (to be implemented)</Box>;
    case 'table':
      // Would render data table
      return <Box p={2}>Table widget (to be implemented)</Box>;
    default:
      return <Box p={2}>Custom widget content</Box>;
  }
};

// Add Widget Dialog Component
interface AddWidgetDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (widgetType: string) => void;
}

const AddWidgetDialog: React.FC<AddWidgetDialogProps> = ({ open, onClose, onAdd }) => {
  const [selectedType, setSelectedType] = useState('metric');

  const widgetTypes = [
    { value: 'metric', label: 'Metric Card', description: 'Display a single metric value' },
    { value: 'chart', label: 'Chart', description: 'Visualize data with charts' },
    { value: 'table', label: 'Data Table', description: 'Display tabular data' },
    { value: 'custom', label: 'Custom', description: 'Custom widget content' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Widget</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Widget Type</InputLabel>
          <Select
            value={selectedType}
            label="Widget Type"
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {widgetTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                <Box>
                  <Typography variant="body1">{type.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {type.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onAdd(selectedType)} variant="contained">
          Add Widget
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Dashboard Settings Dialog Component
interface DashboardSettingsDialogProps {
  open: boolean;
  layout: DashboardLayout;
  onClose: () => void;
  onSave: (layout: DashboardLayout) => void;
}

const DashboardSettingsDialog: React.FC<DashboardSettingsDialogProps> = ({
  open,
  layout,
  onClose,
  onSave,
}) => {
  const [tempLayout, setTempLayout] = useState(layout);

  useEffect(() => {
    setTempLayout(layout);
  }, [layout]);

  const handleSave = () => {
    onSave(tempLayout);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Dashboard Settings</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Dashboard Name"
              value={tempLayout.name}
              onChange={(e) => setTempLayout({ ...tempLayout, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Refresh Interval (seconds)"
              value={tempLayout.settings.refreshInterval}
              onChange={(e) =>
                setTempLayout({
                  ...tempLayout,
                  settings: {
                    ...tempLayout.settings,
                    refreshInterval: parseInt(e.target.value) || 30,
                  },
                })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={tempLayout.description || ''}
              onChange={(e) => setTempLayout({ ...tempLayout, description: e.target.value })}
            />
          </Grid>
        </Grid>
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

export default CustomizableDashboard;