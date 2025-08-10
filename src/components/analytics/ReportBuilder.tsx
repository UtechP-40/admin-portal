import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  DragIndicator,
  Add,
  Delete,
  Edit,
  Save,
  Preview,
  Download,
  ExpandMore,
  BarChart,
  ShowChart,
  PieChart,
  TableChart,
  Assessment,
  FilterList,
  Functions,
  Schedule,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import InteractiveChart, { ChartConfig, ChartSeries } from '../charts/InteractiveChart';
import { analyticsService } from '../../services/analytics';

export interface ReportField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  source: string; // collection name
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  format?: string;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
  value: any;
  label?: string;
}

export interface ReportVisualization {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text';
  title: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

export interface ReportDefinition {
  id: string;
  name: string;
  description?: string;
  dataSources: string[];
  fields: ReportField[];
  filters: ReportFilter[];
  visualizations: ReportVisualization[];
  schedule?: {
    enabled: boolean;
    cron: string;
    recipients: string[];
    format: 'pdf' | 'html' | 'csv';
  };
  createdAt: Date;
  updatedAt: Date;
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
      id={`report-builder-tabpanel-${index}`}
      aria-labelledby={`report-builder-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AVAILABLE_FIELDS: ReportField[] = [
  { id: 'user_count', name: 'User Count', type: 'number', source: 'users', aggregation: 'count' },
  { id: 'game_count', name: 'Game Count', type: 'number', source: 'games', aggregation: 'count' },
  { id: 'error_rate', name: 'Error Rate', type: 'number', source: 'logs', aggregation: 'avg' },
  { id: 'response_time', name: 'Response Time', type: 'number', source: 'metrics', aggregation: 'avg' },
  { id: 'timestamp', name: 'Timestamp', type: 'date', source: 'events' },
  { id: 'user_email', name: 'User Email', type: 'string', source: 'users' },
  { id: 'game_duration', name: 'Game Duration', type: 'number', source: 'games', aggregation: 'avg' },
  { id: 'active_users', name: 'Active Users', type: 'number', source: 'sessions', aggregation: 'count' },
];

const CHART_TYPES = [
  { value: 'line', label: 'Line Chart', icon: <ShowChart /> },
  { value: 'bar', label: 'Bar Chart', icon: <BarChart /> },
  { value: 'pie', label: 'Pie Chart', icon: <PieChart /> },
  { value: 'area', label: 'Area Chart', icon: <ShowChart /> },
  { value: 'table', label: 'Data Table', icon: <TableChart /> },
];

export interface ReportBuilderProps {
  reportId?: string;
  initialReport?: ReportDefinition;
  onSave?: (report: ReportDefinition) => void;
  onCancel?: () => void;
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({
  reportId,
  initialReport,
  onSave,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [report, setReport] = useState<ReportDefinition>(
    initialReport || {
      id: reportId || `report_${Date.now()}`,
      name: 'New Report',
      description: '',
      dataSources: [],
      fields: [],
      filters: [],
      visualizations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
  const [addFilterDialogOpen, setAddFilterDialogOpen] = useState(false);
  const [addVisualizationDialogOpen, setAddVisualizationDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'field') {
      const newFields = Array.from(report.fields);
      const [reorderedField] = newFields.splice(source.index, 1);
      newFields.splice(destination.index, 0, reorderedField);
      setReport({ ...report, fields: newFields });
    } else if (type === 'filter') {
      const newFilters = Array.from(report.filters);
      const [reorderedFilter] = newFilters.splice(source.index, 1);
      newFilters.splice(destination.index, 0, reorderedFilter);
      setReport({ ...report, filters: newFilters });
    }
  };

  const handleAddField = (field: ReportField) => {
    const newField = { ...field, id: `${field.id}_${Date.now()}` };
    setReport({
      ...report,
      fields: [...report.fields, newField],
      dataSources: [...new Set([...report.dataSources, field.source])],
    });
    setAddFieldDialogOpen(false);
  };

  const handleRemoveField = (fieldId: string) => {
    setReport({
      ...report,
      fields: report.fields.filter(f => f.id !== fieldId),
    });
  };

  const handleAddFilter = (filter: ReportFilter) => {
    const newFilter = { ...filter, id: `filter_${Date.now()}` };
    setReport({
      ...report,
      filters: [...report.filters, newFilter],
    });
    setAddFilterDialogOpen(false);
  };

  const handleRemoveFilter = (filterId: string) => {
    setReport({
      ...report,
      filters: report.filters.filter(f => f.id !== filterId),
    });
  };

  const handleAddVisualization = (visualization: Partial<ReportVisualization>) => {
    const newVisualization: ReportVisualization = {
      id: `viz_${Date.now()}`,
      type: 'chart',
      title: 'New Visualization',
      config: {},
      position: { x: 0, y: 0, w: 6, h: 4 },
      ...visualization,
    };
    setReport({
      ...report,
      visualizations: [...report.visualizations, newVisualization],
    });
    setAddVisualizationDialogOpen(false);
  };

  const handleRemoveVisualization = (vizId: string) => {
    setReport({
      ...report,
      visualizations: report.visualizations.filter(v => v.id !== vizId),
    });
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      // Build query from report definition
      const query = {
        collection: report.dataSources[0] || 'events',
        filters: report.filters.reduce((acc, filter) => {
          acc[filter.field] = { [filter.operator]: filter.value };
          return acc;
        }, {} as any),
        aggregation: report.fields
          .filter(f => f.aggregation)
          .map(f => ({
            $group: {
              _id: null,
              [f.id]: { [`$${f.aggregation}`]: `$${f.name}` },
            },
          })),
        limit: 100,
      };

      const data = await analyticsService.executeCustomQuery(query);
      setPreviewData(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error('Failed to preview report:', error);
      setPreviewData([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = () => {
    const updatedReport = { ...report, updatedAt: new Date() };
    onSave?.(updatedReport);
  };

  const handleExport = async (format: 'pdf' | 'html' | 'csv') => {
    try {
      await analyticsService.exportAnalyticsData(
        report.dataSources[0] || 'events',
        report.filters.reduce((acc, filter) => {
          acc[filter.field] = filter.value;
          return acc;
        }, {} as any),
        { format: format as any, filename: report.name }
      );
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5">{report.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {report.description || 'Custom report builder'}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Preview />}
              onClick={handlePreview}
              disabled={report.fields.length === 0}
            >
              Preview
            </Button>
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={() => setScheduleDialogOpen(true)}
            >
              Schedule
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
            >
              Save Report
            </Button>
            {onCancel && (
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper elevation={1}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Data Sources" />
          <Tab label="Fields" />
          <Tab label="Filters" />
          <Tab label="Visualizations" />
          <Tab label="Preview" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Data Sources Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Available Data Sources
              </Typography>
              <List>
                {['users', 'games', 'events', 'logs', 'metrics', 'sessions'].map((source) => (
                  <ListItem
                    key={source}
                    button
                    selected={report.dataSources.includes(source)}
                    onClick={() => {
                      const newSources = report.dataSources.includes(source)
                        ? report.dataSources.filter(s => s !== source)
                        : [...report.dataSources, source];
                      setReport({ ...report, dataSources: newSources });
                    }}
                  >
                    <ListItemIcon>
                      <Assessment />
                    </ListItemIcon>
                    <ListItemText
                      primary={source.charAt(0).toUpperCase() + source.slice(1)}
                      secondary={`Collection: ${source}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Selected Data Sources
              </Typography>
              {report.dataSources.length === 0 ? (
                <Alert severity="info">
                  Select data sources to include in your report
                </Alert>
              ) : (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {report.dataSources.map((source) => (
                    <Chip
                      key={source}
                      label={source}
                      onDelete={() => {
                        setReport({
                          ...report,
                          dataSources: report.dataSources.filter(s => s !== source),
                        });
                      }}
                    />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Fields Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Report Fields</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddFieldDialogOpen(true)}
            >
              Add Field
            </Button>
          </Box>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="fields" type="field">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {report.fields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{ mb: 2 }}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                              <div {...provided.dragHandleProps}>
                                <DragIndicator />
                              </div>
                              <Box flex={1}>
                                <Typography variant="h6">{field.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Type: {field.type} | Source: {field.source}
                                  {field.aggregation && ` | Aggregation: ${field.aggregation}`}
                                </Typography>
                              </Box>
                              <IconButton
                                onClick={() => handleRemoveField(field.id)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {report.fields.length === 0 && (
            <Alert severity="info">
              Add fields to include in your report. Fields define what data will be displayed.
            </Alert>
          )}
        </TabPanel>

        {/* Filters Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Report Filters</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddFilterDialogOpen(true)}
            >
              Add Filter
            </Button>
          </Box>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="filters" type="filter">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {report.filters.map((filter, index) => (
                    <Draggable key={filter.id} draggableId={filter.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{ mb: 2 }}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                              <div {...provided.dragHandleProps}>
                                <DragIndicator />
                              </div>
                              <Box flex={1}>
                                <Typography variant="h6">
                                  {filter.label || filter.field}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {filter.field} {filter.operator} {String(filter.value)}
                                </Typography>
                              </Box>
                              <IconButton
                                onClick={() => handleRemoveFilter(filter.id)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {report.filters.length === 0 && (
            <Alert severity="info">
              Add filters to limit the data included in your report.
            </Alert>
          )}
        </TabPanel>

        {/* Visualizations Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Report Visualizations</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddVisualizationDialogOpen(true)}
            >
              Add Visualization
            </Button>
          </Box>

          <Grid container spacing={3}>
            {report.visualizations.map((viz) => (
              <Grid item xs={12} md={6} lg={4} key={viz.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {viz.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Type: {viz.type}
                    </Typography>
                    <Box sx={{ height: 200, bgcolor: 'grey.100', borderRadius: 1 }}>
                      {/* Visualization preview would go here */}
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        height="100%"
                      >
                        <Typography color="text.secondary">
                          {viz.type.charAt(0).toUpperCase() + viz.type.slice(1)} Preview
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<Edit />}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Delete />}
                      color="error"
                      onClick={() => handleRemoveVisualization(viz.id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {report.visualizations.length === 0 && (
            <Alert severity="info">
              Add visualizations to display your data in charts, tables, or other formats.
            </Alert>
          )}
        </TabPanel>

        {/* Preview Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Report Preview
            </Typography>
            <Box display="flex" gap={2} mb={2}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleExport('pdf')}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleExport('csv')}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleExport('html')}
              >
                Export HTML
              </Button>
            </Box>
          </Box>

          {previewLoading ? (
            <Alert severity="info">Loading preview...</Alert>
          ) : previewData.length > 0 ? (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Sample Data ({previewData.length} records)
              </Typography>
              <Box sx={{ overflow: 'auto', maxHeight: 400 }}>
                <pre>{JSON.stringify(previewData.slice(0, 10), null, 2)}</pre>
              </Box>
            </Paper>
          ) : (
            <Alert severity="info">
              Configure fields and data sources, then click Preview to see your report data.
            </Alert>
          )}
        </TabPanel>
      </Box>

      {/* Add Field Dialog */}
      <AddFieldDialog
        open={addFieldDialogOpen}
        availableFields={AVAILABLE_FIELDS}
        onClose={() => setAddFieldDialogOpen(false)}
        onAdd={handleAddField}
      />

      {/* Add Filter Dialog */}
      <AddFilterDialog
        open={addFilterDialogOpen}
        availableFields={report.fields}
        onClose={() => setAddFilterDialogOpen(false)}
        onAdd={handleAddFilter}
      />

      {/* Add Visualization Dialog */}
      <AddVisualizationDialog
        open={addVisualizationDialogOpen}
        availableFields={report.fields}
        onClose={() => setAddVisualizationDialogOpen(false)}
        onAdd={handleAddVisualization}
      />

      {/* Schedule Dialog */}
      <ScheduleReportDialog
        open={scheduleDialogOpen}
        report={report}
        onClose={() => setScheduleDialogOpen(false)}
        onSave={(schedule) => {
          setReport({ ...report, schedule });
          setScheduleDialogOpen(false);
        }}
      />
    </Box>
  );
};

// Add Field Dialog Component
interface AddFieldDialogProps {
  open: boolean;
  availableFields: ReportField[];
  onClose: () => void;
  onAdd: (field: ReportField) => void;
}

const AddFieldDialog: React.FC<AddFieldDialogProps> = ({
  open,
  availableFields,
  onClose,
  onAdd,
}) => {
  const [selectedField, setSelectedField] = useState<ReportField | null>(null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Field</DialogTitle>
      <DialogContent>
        <List>
          {availableFields.map((field) => (
            <ListItem
              key={field.id}
              button
              selected={selectedField?.id === field.id}
              onClick={() => setSelectedField(field)}
            >
              <ListItemText
                primary={field.name}
                secondary={`${field.type} from ${field.source}${
                  field.aggregation ? ` (${field.aggregation})` : ''
                }`}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => selectedField && onAdd(selectedField)}
          variant="contained"
          disabled={!selectedField}
        >
          Add Field
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Add Filter Dialog Component
interface AddFilterDialogProps {
  open: boolean;
  availableFields: ReportField[];
  onClose: () => void;
  onAdd: (filter: ReportFilter) => void;
}

const AddFilterDialog: React.FC<AddFilterDialogProps> = ({
  open,
  availableFields,
  onClose,
  onAdd,
}) => {
  const [filter, setFilter] = useState<Partial<ReportFilter>>({
    field: '',
    operator: 'eq',
    value: '',
  });

  const handleAdd = () => {
    if (filter.field && filter.operator && filter.value !== undefined) {
      onAdd(filter as ReportFilter);
      setFilter({ field: '', operator: 'eq', value: '' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Filter</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Field</InputLabel>
              <Select
                value={filter.field || ''}
                label="Field"
                onChange={(e) => setFilter({ ...filter, field: e.target.value })}
              >
                {availableFields.map((field) => (
                  <MenuItem key={field.id} value={field.name}>
                    {field.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Operator</InputLabel>
              <Select
                value={filter.operator || 'eq'}
                label="Operator"
                onChange={(e) => setFilter({ ...filter, operator: e.target.value as any })}
              >
                <MenuItem value="eq">Equals</MenuItem>
                <MenuItem value="ne">Not Equals</MenuItem>
                <MenuItem value="gt">Greater Than</MenuItem>
                <MenuItem value="gte">Greater Than or Equal</MenuItem>
                <MenuItem value="lt">Less Than</MenuItem>
                <MenuItem value="lte">Less Than or Equal</MenuItem>
                <MenuItem value="in">In</MenuItem>
                <MenuItem value="nin">Not In</MenuItem>
                <MenuItem value="contains">Contains</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Value"
              value={filter.value || ''}
              onChange={(e) => setFilter({ ...filter, value: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained">
          Add Filter
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Add Visualization Dialog Component
interface AddVisualizationDialogProps {
  open: boolean;
  availableFields: ReportField[];
  onClose: () => void;
  onAdd: (visualization: Partial<ReportVisualization>) => void;
}

const AddVisualizationDialog: React.FC<AddVisualizationDialogProps> = ({
  open,
  availableFields,
  onClose,
  onAdd,
}) => {
  const [viz, setViz] = useState<Partial<ReportVisualization>>({
    type: 'chart',
    title: '',
    config: { type: 'line' },
  });

  const handleAdd = () => {
    if (viz.title) {
      onAdd(viz);
      setViz({ type: 'chart', title: '', config: { type: 'line' } });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Visualization</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Title"
              value={viz.title || ''}
              onChange={(e) => setViz({ ...viz, title: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={viz.type || 'chart'}
                label="Type"
                onChange={(e) => setViz({ ...viz, type: e.target.value as any })}
              >
                <MenuItem value="chart">Chart</MenuItem>
                <MenuItem value="table">Table</MenuItem>
                <MenuItem value="metric">Metric</MenuItem>
                <MenuItem value="text">Text</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {viz.type === 'chart' && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={viz.config?.type || 'line'}
                  label="Chart Type"
                  onChange={(e) =>
                    setViz({
                      ...viz,
                      config: { ...viz.config, type: e.target.value },
                    })
                  }
                >
                  {CHART_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained">
          Add Visualization
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Schedule Report Dialog Component
interface ScheduleReportDialogProps {
  open: boolean;
  report: ReportDefinition;
  onClose: () => void;
  onSave: (schedule: ReportDefinition['schedule']) => void;
}

const ScheduleReportDialog: React.FC<ScheduleReportDialogProps> = ({
  open,
  report,
  onClose,
  onSave,
}) => {
  const [schedule, setSchedule] = useState(
    report.schedule || {
      enabled: false,
      cron: '0 9 * * 1', // Every Monday at 9 AM
      recipients: [],
      format: 'pdf' as const,
    }
  );

  const handleSave = () => {
    onSave(schedule);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Schedule Report</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Schedule</InputLabel>
              <Select
                value={schedule.cron}
                label="Schedule"
                onChange={(e) => setSchedule({ ...schedule, cron: e.target.value })}
              >
                <MenuItem value="0 9 * * *">Daily at 9 AM</MenuItem>
                <MenuItem value="0 9 * * 1">Weekly on Monday at 9 AM</MenuItem>
                <MenuItem value="0 9 1 * *">Monthly on 1st at 9 AM</MenuItem>
                <MenuItem value="0 9 1 1,4,7,10 *">Quarterly at 9 AM</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Recipients (comma-separated emails)"
              value={schedule.recipients.join(', ')}
              onChange={(e) =>
                setSchedule({
                  ...schedule,
                  recipients: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                value={schedule.format}
                label="Format"
                onChange={(e) => setSchedule({ ...schedule, format: e.target.value as any })}
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="html">HTML</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportBuilder;