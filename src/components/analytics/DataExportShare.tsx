import React, { useState } from 'react';
import {
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
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Download,
  Share,
  Delete,
  Visibility,
  GetApp,
  CloudDownload,
  Email,
  Link as LinkIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsService, ExportOptions } from '../../services/analytics';

interface ExportJob {
  id: string;
  name: string;
  collection: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
}

interface ShareLink {
  id: string;
  name: string;
  type: 'dashboard' | 'report' | 'chart';
  url: string;
  expiresAt?: Date;
  accessCount: number;
  isPublic: boolean;
  createdAt: Date;
}

const DataExportShare: React.FC = () => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    collection: 'analytics_events',
    format: 'csv' as 'json' | 'csv' | 'xlsx',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    filters: {},
    includeMetadata: true,
    compression: false,
    filename: ''
  });

  const queryClient = useQueryClient();

  // Fetch export jobs
  const { data: exportJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['exportJobs'],
    queryFn: () => analyticsService.getExportJobs(),
    refetchInterval: 5000, // Refetch every 5 seconds to update progress
  });

  // Fetch share links
  const { data: shareLinks = [], isLoading: linksLoading } = useQuery({
    queryKey: ['shareLinks'],
    queryFn: () => analyticsService.getShareLinks(),
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (config: typeof exportConfig) => {
      const options: ExportOptions = {
        format: config.format,
        filename: config.filename || `export_${Date.now()}`,
        includeMetadata: config.includeMetadata,
        compression: config.compression
      };

      const filters = {
        timestamp: { $gte: config.startDate, $lte: config.endDate },
        ...config.filters
      };

      return analyticsService.exportAnalyticsData(config.collection, filters, options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exportJobs'] });
      setExportDialogOpen(false);
    },
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: (shareData: any) => analyticsService.createShareLink(shareData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareLinks'] });
      setShareDialogOpen(false);
    },
  });

  const handleExport = () => {
    exportMutation.mutate(exportConfig);
  };

  const handleDownload = async (job: ExportJob) => {
    if (job.downloadUrl) {
      const link = document.createElement('a');
      link.href = job.downloadUrl;
      link.download = job.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatStatus = (status: ExportJob['status']) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      pending: 'default',
      processing: 'primary',
      completed: 'success',
      failed: 'error'
    };

    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={colors[status]}
        size="small"
      />
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Data Export & Sharing
      </Typography>

      <Grid container spacing={3}>
        {/* Export Section */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Data Exports</Typography>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => setExportDialogOpen(true)}
              >
                New Export
              </Button>
            </Box>

            <List>
              {exportJobs.map((job) => (
                <ListItem key={job.id} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1">{job.name}</Typography>
                        {formatStatus(job.status)}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {job.collection} • {job.format.toUpperCase()} • Created {new Date(job.createdAt).toLocaleString()}
                        </Typography>
                        {job.status === 'processing' && (
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress variant="determinate" value={job.progress} />
                            <Typography variant="caption" color="text.secondary">
                              {job.progress}% complete
                            </Typography>
                          </Box>
                        )}
                        {job.error && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {job.error}
                          </Alert>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" gap={1}>
                      {job.status === 'completed' && job.downloadUrl && (
                        <IconButton
                          edge="end"
                          onClick={() => handleDownload(job)}
                          title="Download"
                        >
                          <CloudDownload />
                        </IconButton>
                      )}
                      <IconButton edge="end" title="Delete">
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {exportJobs.length === 0 && (
              <Box textAlign="center" py={4}>
                <GetApp sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Export Jobs
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Create your first data export to download analytics data.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={() => setExportDialogOpen(true)}
                >
                  Create Export
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sharing Section */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Shared Links</Typography>
              <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={() => setShareDialogOpen(true)}
              >
                Share
              </Button>
            </Box>

            <List>
              {shareLinks.map((link) => (
                <ListItem key={link.id} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">{link.name}</Typography>
                        {link.isPublic && (
                          <Chip label="Public" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {link.accessCount} views • Created {new Date(link.createdAt).toLocaleDateString()}
                        </Typography>
                        {link.expiresAt && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Expires {new Date(link.expiresAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" gap={1}>
                      <IconButton edge="end" size="small" title="Copy Link">
                        <LinkIcon />
                      </IconButton>
                      <IconButton edge="end" size="small" title="Delete">
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {shareLinks.length === 0 && (
              <Box textAlign="center" py={4}>
                <Share sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No Shared Links
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Share dashboards and reports with others.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  onClick={() => setShareDialogOpen(true)}
                >
                  Create Share Link
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Export Analytics Data</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Data Collection</InputLabel>
                  <Select
                    value={exportConfig.collection}
                    label="Data Collection"
                    onChange={(e) => setExportConfig({ ...exportConfig, collection: e.target.value })}
                  >
                    <MenuItem value="analytics_events">Analytics Events</MenuItem>
                    <MenuItem value="performance_metrics">Performance Metrics</MenuItem>
                    <MenuItem value="error_logs">Error Logs</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Export Format</InputLabel>
                  <Select
                    value={exportConfig.format}
                    label="Export Format"
                    onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value as any })}
                  >
                    <MenuItem value="csv">CSV</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                    <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Start Date"
                  value={exportConfig.startDate}
                  onChange={(date) => date && setExportConfig({ ...exportConfig, startDate: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="End Date"
                  value={exportConfig.endDate}
                  onChange={(date) => date && setExportConfig({ ...exportConfig, endDate: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Filename (optional)"
                  placeholder="my_export"
                  value={exportConfig.filename}
                  onChange={(e) => setExportConfig({ ...exportConfig, filename: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Filters (JSON)"
                  placeholder='{"eventType": "USER_LOGIN"}'
                  value={JSON.stringify(exportConfig.filters, null, 2)}
                  onChange={(e) => {
                    try {
                      const filters = JSON.parse(e.target.value);
                      setExportConfig({ ...exportConfig, filters });
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportConfig.includeMetadata}
                      onChange={(e) => setExportConfig({ ...exportConfig, includeMetadata: e.target.checked })}
                    />
                  }
                  label="Include metadata"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportConfig.compression}
                      onChange={(e) => setExportConfig({ ...exportConfig, compression: e.target.checked })}
                    />
                  }
                  label="Compress file"
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? 'Creating Export...' : 'Start Export'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Share Link</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Link Name"
                placeholder="Dashboard Share Link"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Content Type</InputLabel>
                <Select defaultValue="dashboard" label="Content Type">
                  <MenuItem value="dashboard">Dashboard</MenuItem>
                  <MenuItem value="report">Report</MenuItem>
                  <MenuItem value="chart">Chart</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Expiration Date (optional)"
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox />}
                label="Make public (no authentication required)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Create Share Link</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataExportShare;