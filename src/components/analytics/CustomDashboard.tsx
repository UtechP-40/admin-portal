import React, { useState, useCallback } from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  DragIndicator,
  BarChart as BarChartIcon,
  ShowChart,
  PieChart as PieChartIcon,
  Timeline,
  Assessment,
  Save,
  Restore,
  Share,
  MoreVert
} from '@mui/icons-material';
// Note: Using simple drag and drop without react-beautiful-dnd due to React 19 compatibility
import { LineChart, BarChart, PieChart, AreaChart, MetricCard } from '../charts';
import { analyticsService } from '../../services/analytics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Widget {
  id: string;
  type: 'metric' | 'line' | 'bar' | 'pie' | 'area';
  title: string;
  query: any;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: any[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomDashboardProps {
  dashboardId?: string;
}

const CustomDashboard: React.FC<CustomDashboardProps> = ({ dashboardId }) => {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [widgetDialogOpen, setWidgetDialogOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const queryClient = useQueryClient();

  const { data: dashboards = [] } = useQuery({
    queryKey: ['customDashboards'],
    queryFn: () => analyticsService.getCustomDashboards(),
  });

  const { data: widgetData = {} } = useQuery({
    queryKey: ['widgetData', dashboard?.widgets],
    queryFn: async () => {
      if (!dashboard?.widgets) return {};
      
      const data: Record<string, any> = {};
      for (const widget of dashboard.widgets) {
        try {
          const result = await analyticsService.executeCustomQuery(widget.query);
          data[widget.id] = result;
        } catch (error) {
          console.error(`Failed to fetch data for widget ${widget.id}:`, error);
          data[widget.id] = [];
        }
      }
      return data;
    },
    enabled: !!dashboard?.widgets?.length,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const saveDashboardMutation = useMutation({
    mutationFn: (dashboardData: Partial<Dashboard>) => 
      analyticsService.saveDashboard(dashboardData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customDashboards'] });
      setEditMode(false);
    },
  });

  const deleteDashboardMutation = useMutation({
    mutationFn: (id: string) => analyticsService.deleteDashboard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customDashboards'] });
    },
  });

  const handleMoveWidget = useCallback((widgetId: string, direction: 'up' | 'down') => {
    if (!dashboard) return;

    const currentIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (currentIndex === -1) return;

    const newWidgets = [...dashboard.widgets];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= newWidgets.length) return;

    [newWidgets[currentIndex], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[currentIndex]];

    setDashboard({
      ...dashboard,
      widgets: newWidgets
    });
  }, [dashboard]);

  const handleAddWidget = () => {
    setEditingWidget(null);
    setWidgetDialogOpen(true);
  };

  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
    setWidgetDialogOpen(true);
  };

  const handleDeleteWidget = (widgetId: string) => {
    if (!dashboard) return;
    
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.filter(w => w.id !== widgetId)
    });
  };

  const handleSaveWidget = (widgetData: Partial<Widget>) => {
    if (!dashboard) return;

    if (editingWidget) {
      // Update existing widget
      setDashboard({
        ...dashboard,
        widgets: dashboard.widgets.map(w => 
          w.id === editingWidget.id ? { ...w, ...widgetData } : w
        )
      });
    } else {
      // Add new widget
      const newWidget: Widget = {
        id: `widget_${Date.now()}`,
        type: 'metric',
        title: 'New Widget',
        query: {},
        config: {},
        position: { x: 0, y: 0, w: 4, h: 3 },
        ...widgetData
      };
      
      setDashboard({
        ...dashboard,
        widgets: [...dashboard.widgets, newWidget]
      });
    }
    
    setWidgetDialogOpen(false);
    setEditingWidget(null);
  };

  const handleSaveDashboard = () => {
    if (!dashboard) return;
    
    saveDashboardMutation.mutate(dashboard);
  };

  const renderWidget = (widget: Widget, index: number) => {
    const data = widgetData[widget.id] || [];
    
    const widgetContent = () => {
      switch (widget.type) {
        case 'metric':
          return (
            <MetricCard
              title={widget.title}
              value={data.value || 0}
              change={data.change}
              icon={data.icon}
              loading={!data}
            />
          );
        case 'line':
          return (
            <LineChart
              data={data}
              title={widget.title}
              xKey={widget.config.xKey || 'x'}
              yKey={widget.config.yKey || 'y'}
              height={widget.config.height || 300}
            />
          );
        case 'bar':
          return (
            <BarChart
              data={data}
              title={widget.title}
              xKey={widget.config.xKey || 'x'}
              yKey={widget.config.yKey || 'y'}
              height={widget.config.height || 300}
              horizontal={widget.config.horizontal}
            />
          );
        case 'pie':
          return (
            <PieChart
              data={data}
              title={widget.title}
              dataKey={widget.config.dataKey || 'value'}
              nameKey={widget.config.nameKey || 'name'}
              height={widget.config.height || 300}
            />
          );
        case 'area':
          return (
            <AreaChart
              data={data}
              title={widget.title}
              xKey={widget.config.xKey || 'x'}
              yKey={widget.config.yKey || 'y'}
              height={widget.config.height || 300}
            />
          );
        default:
          return <Typography>Unknown widget type</Typography>;
      }
    };

    return (
      <Grid
        item
        xs={12}
        md={widget.position.w}
        key={widget.id}
      >
        <Card
          sx={{
            height: '100%',
            border: editMode ? '2px dashed' : 'none',
            borderColor: 'primary.main'
          }}
        >
          {editMode && (
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              p={1}
              bgcolor="grey.100"
            >
              <Box display="flex" alignItems="center">
                <DragIndicator sx={{ mr: 1 }} />
                <Typography variant="caption">
                  {widget.title}
                </Typography>
              </Box>
              <Box>
                <IconButton size="small" onClick={() => handleMoveWidget(widget.id, 'up')}>
                  <Edit />
                </IconButton>
                <IconButton size="small" onClick={() => handleEditWidget(widget)}>
                  <Edit />
                </IconButton>
                <IconButton size="small" onClick={() => handleDeleteWidget(widget.id)}>
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          )}
          <CardContent sx={{ p: editMode ? 1 : 3 }}>
            {widgetContent()}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  if (!dashboard) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Custom Dashboards
        </Typography>
        <Grid container spacing={3}>
          {dashboards.map((dash: Dashboard) => (
            <Grid item xs={12} sm={6} md={4} key={dash.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {dash.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dash.description}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {dash.widgets.length} widgets • Updated {new Date(dash.updatedAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => setDashboard(dash)}>
                    Open
                  </Button>
                  <Button size="small" onClick={() => handleEditWidget(dash as any)}>
                    Edit
                  </Button>
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => deleteDashboardMutation.mutate(dash.id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setDashboard({
                    id: `dashboard_${Date.now()}`,
                    name: 'New Dashboard',
                    description: '',
                    widgets: [],
                    layout: [],
                    isPublic: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  })}
                >
                  Create New Dashboard
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            {dashboard.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dashboard.description}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant={editMode ? "contained" : "outlined"}
            startIcon={<Edit />}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Exit Edit' : 'Edit'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Save />}
            onClick={handleSaveDashboard}
            disabled={!editMode}
          >
            Save
          </Button>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {dashboard.widgets.map((widget, index) => renderWidget(widget, index))}
      </Grid>

      {editMode && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleAddWidget}
        >
          <Add />
        </Fab>
      )}

      {/* Widget Configuration Dialog */}
      <WidgetConfigDialog
        open={widgetDialogOpen}
        widget={editingWidget}
        onClose={() => setWidgetDialogOpen(false)}
        onSave={handleSaveWidget}
      />

      {/* Dashboard Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setShareDialogOpen(true)}>
          <ListItemIcon><Share /></ListItemIcon>
          <ListItemText>Share Dashboard</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setDashboard(null)}>
          <ListItemIcon><Restore /></ListItemIcon>
          <ListItemText>Back to List</ListItemText>
        </MenuItem>
      </Menu>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Dashboard</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Share this dashboard with other users or make it public.
          </Typography>
          {/* Share functionality would be implemented here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Share</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Widget Configuration Dialog Component
interface WidgetConfigDialogProps {
  open: boolean;
  widget: Widget | null;
  onClose: () => void;
  onSave: (widget: Partial<Widget>) => void;
}

const WidgetConfigDialog: React.FC<WidgetConfigDialogProps> = ({
  open,
  widget,
  onClose,
  onSave
}) => {
  const [widgetData, setWidgetData] = useState<Partial<Widget>>({
    type: 'metric',
    title: '',
    query: {},
    config: {}
  });

  React.useEffect(() => {
    if (widget) {
      setWidgetData(widget);
    } else {
      setWidgetData({
        type: 'metric',
        title: '',
        query: {},
        config: {}
      });
    }
  }, [widget]);

  const handleSave = () => {
    onSave(widgetData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {widget ? 'Edit Widget' : 'Add Widget'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Widget Title"
              value={widgetData.title || ''}
              onChange={(e) => setWidgetData({ ...widgetData, title: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Widget Type</InputLabel>
              <Select
                value={widgetData.type || 'metric'}
                label="Widget Type"
                onChange={(e) => setWidgetData({ ...widgetData, type: e.target.value as any })}
              >
                <MenuItem value="metric">
                  <Box display="flex" alignItems="center">
                    <Assessment sx={{ mr: 1 }} />
                    Metric Card
                  </Box>
                </MenuItem>
                <MenuItem value="line">
                  <Box display="flex" alignItems="center">
                    <ShowChart sx={{ mr: 1 }} />
                    Line Chart
                  </Box>
                </MenuItem>
                <MenuItem value="bar">
                  <Box display="flex" alignItems="center">
                    <BarChartIcon sx={{ mr: 1 }} />
                    Bar Chart
                  </Box>
                </MenuItem>
                <MenuItem value="pie">
                  <Box display="flex" alignItems="center">
                    <PieChartIcon sx={{ mr: 1 }} />
                    Pie Chart
                  </Box>
                </MenuItem>
                <MenuItem value="area">
                  <Box display="flex" alignItems="center">
                    <Timeline sx={{ mr: 1 }} />
                    Area Chart
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Query Configuration (JSON)"
              value={JSON.stringify(widgetData.query || {}, null, 2)}
              onChange={(e) => {
                try {
                  const query = JSON.parse(e.target.value);
                  setWidgetData({ ...widgetData, query });
                } catch (error) {
                  // Invalid JSON, don't update
                }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Widget Configuration (JSON)"
              value={JSON.stringify(widgetData.config || {}, null, 2)}
              onChange={(e) => {
                try {
                  const config = JSON.parse(e.target.value);
                  setWidgetData({ ...widgetData, config });
                } catch (error) {
                  // Invalid JSON, don't update
                }
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {widget ? 'Update' : 'Add'} Widget
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomDashboard;