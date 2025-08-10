import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  MoreVert,
  Settings,
  Delete,
  Refresh,
  Fullscreen,
  Close,
} from '@mui/icons-material';
import { Rnd } from 'react-rnd';

export interface WidgetConfig {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'custom';
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  refreshInterval?: number; // in seconds
  lastUpdated?: Date;
}

export interface DashboardWidgetProps {
  widget: WidgetConfig;
  isEditing?: boolean;
  onUpdate?: (widget: WidgetConfig) => void;
  onDelete?: (widgetId: string) => void;
  onRefresh?: (widgetId: string) => void;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  isEditing = false,
  onUpdate,
  onDelete,
  onRefresh,
  children,
  loading = false,
  error,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<WidgetConfig>(widget);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleConfigOpen = () => {
    setTempConfig(widget);
    setConfigDialogOpen(true);
    handleMenuClose();
  };

  const handleConfigSave = () => {
    onUpdate?.(tempConfig);
    setConfigDialogOpen(false);
  };

  const handleRefresh = () => {
    onRefresh?.(widget.id);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete?.(widget.id);
    handleMenuClose();
  };

  const handleFullscreen = () => {
    setFullscreenOpen(true);
    handleMenuClose();
  };

  const handlePositionChange = (position: { x: number; y: number }) => {
    if (onUpdate) {
      onUpdate({ ...widget, position });
    }
  };

  const handleSizeChange = (size: { width: number; height: number }) => {
    if (onUpdate) {
      onUpdate({ ...widget, size });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box p={2}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="rectangular" width="100%" height={120} sx={{ mt: 1 }} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box p={2}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={handleRefresh} startIcon={<Refresh />}>
            Retry
          </Button>
        </Box>
      );
    }

    return children;
  };

  const widgetContent = (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: isEditing ? '2px dashed #1976d2' : 'none',
      }}
    >
      {/* Widget Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={2}
        py={1}
        borderBottom="1px solid"
        borderColor="divider"
        bgcolor="background.paper"
      >
        <Typography variant="h6" noWrap>
          {widget.title}
        </Typography>
        <Box display="flex" alignItems="center">
          {widget.lastUpdated && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              {new Date(widget.lastUpdated).toLocaleTimeString()}
            </Typography>
          )}
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Widget Content */}
      <Box flex={1} overflow="auto">
        {renderContent()}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleRefresh}>
          <Refresh sx={{ mr: 1 }} />
          Refresh
        </MenuItem>
        <MenuItem onClick={handleFullscreen}>
          <Fullscreen sx={{ mr: 1 }} />
          Fullscreen
        </MenuItem>
        <MenuItem onClick={handleConfigOpen}>
          <Settings sx={{ mr: 1 }} />
          Configure
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Paper>
  );

  // Render as draggable/resizable if in editing mode
  if (isEditing) {
    return (
      <>
        <Rnd
          position={widget.position}
          size={widget.size}
          onDragStop={(e, d) => handlePositionChange({ x: d.x, y: d.y })}
          onResizeStop={(e, direction, ref, delta, position) => {
            handleSizeChange({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
            });
            handlePositionChange(position);
          }}
          minWidth={200}
          minHeight={150}
          bounds="parent"
          dragHandleClassName="widget-drag-handle"
        >
          <Box
            className="widget-drag-handle"
            sx={{
              width: '100%',
              height: '100%',
              cursor: 'move',
            }}
          >
            {widgetContent}
          </Box>
        </Rnd>

        {/* Configuration Dialog */}
        <WidgetConfigDialog
          open={configDialogOpen}
          widget={tempConfig}
          onClose={() => setConfigDialogOpen(false)}
          onSave={handleConfigSave}
          onChange={setTempConfig}
        />

        {/* Fullscreen Dialog */}
        <Dialog
          open={fullscreenOpen}
          onClose={() => setFullscreenOpen(false)}
          maxWidth="lg"
          fullWidth
          fullScreen
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
            <Typography variant="h5">{widget.title}</Typography>
            <IconButton onClick={() => setFullscreenOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <Box flex={1} p={2}>
            {renderContent()}
          </Box>
        </Dialog>
      </>
    );
  }

  // Render as static widget
  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          left: widget.position.x,
          top: widget.position.y,
          width: widget.size.width,
          height: widget.size.height,
        }}
      >
        {widgetContent}
      </Box>

      {/* Configuration Dialog */}
      <WidgetConfigDialog
        open={configDialogOpen}
        widget={tempConfig}
        onClose={() => setConfigDialogOpen(false)}
        onSave={handleConfigSave}
        onChange={setTempConfig}
      />

      {/* Fullscreen Dialog */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Typography variant="h5">{widget.title}</Typography>
          <IconButton onClick={() => setFullscreenOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        <Box flex={1} p={2}>
          {renderContent()}
        </Box>
      </Dialog>
    </>
  );
};

// Widget Configuration Dialog Component
interface WidgetConfigDialogProps {
  open: boolean;
  widget: WidgetConfig;
  onClose: () => void;
  onSave: () => void;
  onChange: (widget: WidgetConfig) => void;
}

const WidgetConfigDialog: React.FC<WidgetConfigDialogProps> = ({
  open,
  widget,
  onClose,
  onSave,
  onChange,
}) => {
  const handleFieldChange = (field: string, value: any) => {
    onChange({ ...widget, [field]: value });
  };

  const handleConfigChange = (configField: string, value: any) => {
    onChange({
      ...widget,
      config: { ...widget.config, [configField]: value },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Configure Widget</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Widget Title"
              value={widget.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Widget Type</InputLabel>
              <Select
                value={widget.type}
                label="Widget Type"
                onChange={(e) => handleFieldChange('type', e.target.value)}
              >
                <MenuItem value="metric">Metric Card</MenuItem>
                <MenuItem value="chart">Chart</MenuItem>
                <MenuItem value="table">Data Table</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Refresh Interval (seconds)"
              value={widget.refreshInterval || 30}
              onChange={(e) => handleFieldChange('refreshInterval', parseInt(e.target.value) || 30)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Width (px)"
              value={widget.size.width}
              onChange={(e) => handleFieldChange('size', { ...widget.size, width: parseInt(e.target.value) || 300 })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Height (px)"
              value={widget.size.height}
              onChange={(e) => handleFieldChange('size', { ...widget.size, height: parseInt(e.target.value) || 200 })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Widget Configuration (JSON)"
              value={JSON.stringify(widget.config, null, 2)}
              onChange={(e) => {
                try {
                  const config = JSON.parse(e.target.value);
                  handleFieldChange('config', config);
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
        <Button onClick={onSave} variant="contained">
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DashboardWidget;