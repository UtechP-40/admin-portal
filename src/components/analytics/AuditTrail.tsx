import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '../../services/auditService';
import {
  AuditEvent,
  AuditEventType,
  AuditCategory,
  AuditSeverity,
  AuditLogQuery,
} from '../../types/audit';
import { LoadingSpinner } from '../common';
import { format } from 'date-fns';

// Severity color mapping
const severityColors: Record<AuditSeverity, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  [AuditSeverity.LOW]: 'success',
  [AuditSeverity.MEDIUM]: 'warning',
  [AuditSeverity.HIGH]: 'error',
  [AuditSeverity.CRITICAL]: 'error',
};

// Category icons
const categoryIcons: Record<AuditCategory, React.ReactNode> = {
  [AuditCategory.AUTHENTICATION]: <PersonIcon />,
  [AuditCategory.AUTHORIZATION]: <SecurityIcon />,
  [AuditCategory.USER_MANAGEMENT]: <PersonIcon />,
  [AuditCategory.SYSTEM_CONFIGURATION]: <SettingsIcon />,
  [AuditCategory.DATABASE]: <StorageIcon />,
  [AuditCategory.SECURITY]: <SecurityIcon />,
  [AuditCategory.GAME_MANAGEMENT]: <SettingsIcon />,
  [AuditCategory.SYSTEM]: <SettingsIcon />,
  [AuditCategory.TESTING]: <SettingsIcon />,
};

interface AuditTrailProps {
  userId?: string;
  resource?: string;
  showFilters?: boolean;
  maxHeight?: number;
}

const AuditTrail: React.FC<AuditTrailProps> = ({
  userId,
  resource,
  showFilters = true,
  maxHeight = 600,
}) => {
  const [query, setQuery] = useState<AuditLogQuery>({
    page: 0,
    limit: 25,
    sortBy: 'timestamp',
    sortOrder: 'desc',
    userId,
    resource,
  });
  
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch audit logs
  const {
    data: auditData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['auditLogs', query],
    queryFn: () => auditService.getAuditLogs(query),
    keepPreviousData: true,
  });

  const handlePageChange = (event: unknown, newPage: number) => {
    setQuery(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(prev => ({ ...prev, limit: parseInt(event.target.value, 10), page: 0 }));
  };

  const handleFilterChange = (field: keyof AuditLogQuery, value: any) => {
    setQuery(prev => ({ ...prev, [field]: value, page: 0 }));
  };

  const handleMultiSelectChange = (event: SelectChangeEvent<string[]>, field: keyof AuditLogQuery) => {
    const value = event.target.value as string[];
    handleFilterChange(field, value.length > 0 ? value : undefined);
  };

  const handleViewDetails = (event: AuditEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleExport = async () => {
    try {
      const blob = await auditService.exportAuditLogs({
        format: 'csv',
        query,
        includeMetadata: true,
        includeUserDetails: true,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const toggleRowExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedRows(newExpanded);
  };

  const formatTimestamp = (timestamp: Date) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
  };

  if (error) {
    return (
      <Alert severity="error">
        Failed to load audit logs. Please try again.
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Audit Trail
              {auditData && (
                <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                  ({auditData.total} events)
                </Typography>
              )}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {showFilters && (
                <Tooltip title="Toggle Filters">
                  <IconButton onClick={() => setShowFiltersPanel(!showFiltersPanel)}>
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Refresh">
                <IconButton onClick={() => refetch()}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export">
                <IconButton onClick={handleExport}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Filters Panel */}
          {showFilters && (
            <Collapse in={showFiltersPanel}>
              <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Start Date"
                      value={query.startDate || null}
                      onChange={(date) => handleFilterChange('startDate', date)}
                      slotProps={{
                        textField: { size: 'small', fullWidth: true }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="End Date"
                      value={query.endDate || null}
                      onChange={(date) => handleFilterChange('endDate', date)}
                      slotProps={{
                        textField: { size: 'small', fullWidth: true }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Categories</InputLabel>
                      <Select
                        multiple
                        value={query.categories || []}
                        onChange={(e) => handleMultiSelectChange(e, 'categories')}
                        input={<OutlinedInput label="Categories" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {Object.values(AuditCategory).map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Severities</InputLabel>
                      <Select
                        multiple
                        value={query.severities || []}
                        onChange={(e) => handleMultiSelectChange(e, 'severities')}
                        input={<OutlinedInput label="Severities" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip 
                                key={value} 
                                label={value} 
                                size="small" 
                                color={severityColors[value as AuditSeverity]}
                              />
                            ))}
                          </Box>
                        )}
                      >
                        {Object.values(AuditSeverity).map((severity) => (
                          <MenuItem key={severity} value={severity}>
                            <Chip 
                              label={severity} 
                              size="small" 
                              color={severityColors[severity]}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="User Email"
                      value={query.userEmail || ''}
                      onChange={(e) => handleFilterChange('userEmail', e.target.value || undefined)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Resource"
                      value={query.resource || ''}
                      onChange={(e) => handleFilterChange('resource', e.target.value || undefined)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search"
                      value={query.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                      placeholder="Search in descriptions..."
                    />
                  </Grid>
                </Grid>
              </Card>
            </Collapse>
          )}

          {/* Audit Events Table */}
          <TableContainer sx={{ maxHeight }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width="40px"></TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell width="60px">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <LoadingSpinner />
                    </TableCell>
                  </TableRow>
                ) : auditData?.events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary">
                        No audit events found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  auditData?.events.map((event) => (
                    <React.Fragment key={event.id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleRowExpansion(event.id)}
                          >
                            {expandedRows.has(event.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatTimestamp(event.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {event.userName || event.userEmail || 'System'}
                            </Typography>
                            {event.userRole && (
                              <Typography variant="caption" color="text.secondary">
                                {event.userRole}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {categoryIcons[event.category]}
                            <Typography variant="body2">
                              {event.category}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {event.eventType}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.severity}
                            size="small"
                            color={severityColors[event.severity]}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {event.resource || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.success ? 'Success' : 'Failed'}
                            size="small"
                            color={event.success ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(event)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Row */}
                      <TableRow>
                        <TableCell colSpan={9} sx={{ py: 0 }}>
                          <Collapse in={expandedRows.has(event.id)}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="body2" gutterBottom>
                                <strong>Description:</strong> {event.description}
                              </Typography>
                              {event.errorMessage && (
                                <Typography variant="body2" color="error" gutterBottom>
                                  <strong>Error:</strong> {event.errorMessage}
                                </Typography>
                              )}
                              {event.ipAddress && (
                                <Typography variant="body2" gutterBottom>
                                  <strong>IP Address:</strong> {event.ipAddress}
                                </Typography>
                              )}
                              {event.duration && (
                                <Typography variant="body2" gutterBottom>
                                  <strong>Duration:</strong> {event.duration}ms
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {auditData && (
            <TablePagination
              component="div"
              count={auditData.total}
              page={query.page || 0}
              onPageChange={handlePageChange}
              rowsPerPage={query.limit || 25}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog
        open={showEventDetails}
        onClose={() => setShowEventDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Audit Event Details
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Event ID
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedEvent.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Timestamp
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {formatTimestamp(selectedEvent.timestamp)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedEvent.description}
                  </Typography>
                </Grid>
                {selectedEvent.metadata && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Metadata
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        bgcolor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.875rem',
                      }}
                    >
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventDetails(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AuditTrail;