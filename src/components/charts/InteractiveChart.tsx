import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import {
  MoreVert,
  ZoomIn,
  ZoomOut,
  Refresh,
  Download,
  Fullscreen,
  Settings,
  FilterList,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Brush,
  ReferenceLine,
  ReferenceArea,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ComposedChart,
} from 'recharts';

export interface ChartDataPoint {
  [key: string]: any;
  timestamp?: string | number | Date;
  value?: number;
  category?: string;
}

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  type?: 'line' | 'area' | 'bar' | 'scatter';
  yAxisId?: 'left' | 'right';
  strokeWidth?: number;
  fillOpacity?: number;
}

export interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'pie' | 'scatter' | 'composed';
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  series: ChartSeries[];
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showBrush?: boolean;
  showTooltip?: boolean;
  height?: number;
  colors?: string[];
  annotations?: ChartAnnotation[];
  filters?: ChartFilter[];
}

export interface ChartAnnotation {
  type: 'line' | 'area';
  value?: number;
  startValue?: number;
  endValue?: number;
  label?: string;
  color?: string;
  strokeDasharray?: string;
}

export interface ChartFilter {
  key: string;
  label: string;
  type: 'select' | 'range' | 'date';
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
}

export interface InteractiveChartProps {
  config: ChartConfig;
  loading?: boolean;
  error?: string;
  onDataPointClick?: (dataPoint: ChartDataPoint, series: ChartSeries) => void;
  onZoom?: (domain: { startIndex?: number; endIndex?: number }) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onExport?: (format: 'png' | 'svg' | 'csv' | 'json') => void;
  onRefresh?: () => void;
}

const DEFAULT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#0088fe', '#00c49f', '#ffbb28', '#ff8042', '#8dd1e1',
];

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  config,
  loading = false,
  error,
  onDataPointClick,
  onZoom,
  onFilter,
  onExport,
  onRefresh,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [zoomDomain, setZoomDomain] = useState<{ startIndex?: number; endIndex?: number } | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0) return config.data;

    return config.data.filter(dataPoint => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === '') return true;
        
        const filter = config.filters?.find(f => f.key === key);
        if (!filter) return true;

        switch (filter.type) {
          case 'select':
            return dataPoint[key] === value;
          case 'range':
            const numValue = Number(dataPoint[key]);
            return numValue >= value.min && numValue <= value.max;
          case 'date':
            const dateValue = new Date(dataPoint[key]);
            return dateValue >= new Date(value.start) && dateValue <= new Date(value.end);
          default:
            return true;
        }
      });
    });
  }, [config.data, config.filters, filters]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleZoom = useCallback((domain: any) => {
    setZoomDomain(domain);
    onZoom?.(domain);
  }, [onZoom]);

  const handleDataPointClick = useCallback((data: any, index: number) => {
    if (onDataPointClick && config.series.length > 0) {
      onDataPointClick(data, config.series[0]);
    }
  }, [onDataPointClick, config.series]);

  const handleFilterChange = (filterKey: string, value: any) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  const handleExport = (format: 'png' | 'svg' | 'csv' | 'json') => {
    onExport?.(format);
    handleMenuClose();
  };

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    const xAxisProps = {
      dataKey: config.xAxisKey,
      label: config.xAxisLabel ? { value: config.xAxisLabel, position: 'insideBottom', offset: -10 } : undefined,
    };

    const yAxisProps = {
      label: config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined,
    };

    switch (config.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {config.showTooltip && <RechartsTooltip />}
            {config.showLegend && <Legend />}
            {config.series.map((series, index) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                stroke={series.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                strokeWidth={series.strokeWidth || 2}
                name={series.name}
                onClick={handleDataPointClick}
              />
            ))}
            {config.annotations?.map((annotation, index) => (
              annotation.type === 'line' ? (
                <ReferenceLine
                  key={index}
                  y={annotation.value}
                  stroke={annotation.color || '#ff0000'}
                  strokeDasharray={annotation.strokeDasharray || '5 5'}
                  label={annotation.label}
                />
              ) : (
                <ReferenceArea
                  key={index}
                  y1={annotation.startValue}
                  y2={annotation.endValue}
                  fill={annotation.color || '#ff0000'}
                  fillOpacity={0.1}
                  label={annotation.label}
                />
              )
            ))}
            {config.showBrush && <Brush dataKey={config.xAxisKey} height={30} />}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {config.showTooltip && <RechartsTooltip />}
            {config.showLegend && <Legend />}
            {config.series.map((series, index) => (
              <Area
                key={series.key}
                type="monotone"
                dataKey={series.key}
                stackId="1"
                stroke={series.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                fill={series.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                fillOpacity={series.fillOpacity || 0.6}
                name={series.name}
              />
            ))}
            {config.showBrush && <Brush dataKey={config.xAxisKey} height={30} />}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {config.showTooltip && <RechartsTooltip />}
            {config.showLegend && <Legend />}
            {config.series.map((series, index) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                fill={series.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                name={series.name}
                onClick={handleDataPointClick}
              />
            ))}
            {config.showBrush && <Brush dataKey={config.xAxisKey} height={30} />}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={config.series[0]?.key || 'value'}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
              ))}
            </Pie>
            {config.showTooltip && <RechartsTooltip />}
            {config.showLegend && <Legend />}
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {config.showTooltip && <RechartsTooltip />}
            {config.showLegend && <Legend />}
            {config.series.map((series, index) => (
              <Scatter
                key={series.key}
                name={series.name}
                data={filteredData}
                fill={series.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </ScatterChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {config.showTooltip && <RechartsTooltip />}
            {config.showLegend && <Legend />}
            {config.series.map((series, index) => {
              const color = series.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
              switch (series.type) {
                case 'line':
                  return (
                    <Line
                      key={series.key}
                      type="monotone"
                      dataKey={series.key}
                      stroke={color}
                      name={series.name}
                      yAxisId={series.yAxisId || 'left'}
                    />
                  );
                case 'area':
                  return (
                    <Area
                      key={series.key}
                      type="monotone"
                      dataKey={series.key}
                      fill={color}
                      name={series.name}
                      yAxisId={series.yAxisId || 'left'}
                    />
                  );
                case 'bar':
                  return (
                    <Bar
                      key={series.key}
                      dataKey={series.key}
                      fill={color}
                      name={series.name}
                      yAxisId={series.yAxisId || 'left'}
                    />
                  );
                default:
                  return null;
              }
            })}
            {config.showBrush && <Brush dataKey={config.xAxisKey} height={30} />}
          </ComposedChart>
        );

      default:
        return <Typography>Unsupported chart type: {config.type}</Typography>;
    }
  };

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>
          Error loading chart
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {error}
        </Typography>
        <Button variant="outlined" onClick={onRefresh} startIcon={<Refresh />}>
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      {/* Chart Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6">{config.title}</Typography>
          {config.subtitle && (
            <Typography variant="body2" color="text.secondary">
              {config.subtitle}
            </Typography>
          )}
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          {/* Active Filters */}
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            const filter = config.filters?.find(f => f.key === key);
            return (
              <Chip
                key={key}
                label={`${filter?.label || key}: ${value}`}
                size="small"
                onDelete={() => handleFilterChange(key, null)}
              />
            );
          })}

          {/* Action Buttons */}
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={onRefresh} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fullscreen">
            <IconButton size="small" onClick={() => setFullscreenOpen(true)}>
              <Fullscreen />
            </IconButton>
          </Tooltip>

          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Filters */}
      {config.filters && config.filters.length > 0 && (
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          {config.filters.map((filter) => (
            <FormControl key={filter.key} size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{filter.label}</InputLabel>
              <Select
                value={filters[filter.key] || ''}
                label={filter.label}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {filter.options?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Box>
      )}

      {/* Chart */}
      <Box sx={{ width: '100%', height: config.height || 400 }}>
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleExport('png')}>
          <Download sx={{ mr: 1 }} />
          Export as PNG
        </MenuItem>
        <MenuItem onClick={() => handleExport('svg')}>
          <Download sx={{ mr: 1 }} />
          Export as SVG
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>
          <Download sx={{ mr: 1 }} />
          Export as CSV
        </MenuItem>
        <MenuItem onClick={() => handleExport('json')}>
          <Download sx={{ mr: 1 }} />
          Export as JSON
        </MenuItem>
        <MenuItem onClick={() => setSettingsOpen(true)}>
          <Settings sx={{ mr: 1 }} />
          Chart Settings
        </MenuItem>
      </Menu>

      {/* Fullscreen Dialog */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">{config.title}</Typography>
            <IconButton onClick={() => setFullscreenOpen(false)}>
              <Fullscreen />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ width: '100%', height: 'calc(100vh - 200px)' }}>
            <ResponsiveContainer>
              {renderChart()}
            </ResponsiveContainer>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <ChartSettingsDialog
        open={settingsOpen}
        config={config}
        onClose={() => setSettingsOpen(false)}
        onSave={(newConfig) => {
          // Handle config update
          setSettingsOpen(false);
        }}
      />
    </Paper>
  );
};

// Chart Settings Dialog Component
interface ChartSettingsDialogProps {
  open: boolean;
  config: ChartConfig;
  onClose: () => void;
  onSave: (config: ChartConfig) => void;
}

const ChartSettingsDialog: React.FC<ChartSettingsDialogProps> = ({
  open,
  config,
  onClose,
  onSave,
}) => {
  const [tempConfig, setTempConfig] = useState(config);

  const handleSave = () => {
    onSave(tempConfig);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Chart Settings</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Chart Title"
              value={tempConfig.title}
              onChange={(e) => setTempConfig({ ...tempConfig, title: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Chart Subtitle"
              value={tempConfig.subtitle || ''}
              onChange={(e) => setTempConfig({ ...tempConfig, subtitle: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="X-Axis Label"
              value={tempConfig.xAxisLabel || ''}
              onChange={(e) => setTempConfig({ ...tempConfig, xAxisLabel: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Y-Axis Label"
              value={tempConfig.yAxisLabel || ''}
              onChange={(e) => setTempConfig({ ...tempConfig, yAxisLabel: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Chart Height"
              value={tempConfig.height || 400}
              onChange={(e) => setTempConfig({ ...tempConfig, height: parseInt(e.target.value) || 400 })}
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

export default InteractiveChart;