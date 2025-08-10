import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridToolbar,
  GridActionsCellItem,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as ResolveIcon,
  Cancel as IgnoreIcon,
  Flag as FlagIcon,
  LocationOn as LocationIcon,
  Computer as DeviceIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { securityService } from '../../services/securityService';
import {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  SecurityEventStatus,
} from '../../types/security';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types/permissions';

interface SecurityEventsTableProps {
  height?: number;
}

const SecurityEventsTable: React.FC<SecurityEventsTableProps> = ({ height = 600 }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<SecurityEventStatus>(SecurityEventStatus.OPEN);
  const [statusNotes, setStatusNotes] = useState('');
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    eventId: string;
  } | null>(null);
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    status: '',
    search: '',
  });

  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManageSecurity = hasPermission(Permission.SECURITY_MANAGE);

  // Query for security events
  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ['security', 'events', page, pageSize, filters],
    queryFn: () => securityService.getSecurityEvents({
      page: page + 1,
      limit: pageSize,
      severity: filters.severity || undefined,
      type: filters.type as SecurityEventType || undefined,
      status: filters.status as SecurityEventStatus || undefined,
      search: filters.search || undefined,
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: SecurityEventStatus; notes?: string }) =>
      securityService.updateSecurityEventStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'events'] });
      setStatusDialogOpen(false);
      setStatusNotes('');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status, notes }: { ids: string[]; status: SecurityEventStatus; notes?: string }) =>
      securityService.bulkUpdateSecurityEvents(ids, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'events'] });
      setSelectionModel([]);
    },
  });

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

  const getStatusColor = (status: SecurityEventStatus) => {
    switch (status) {
      case SecurityEventStatus.OPEN:
        return 'error';
      case SecurityEventStatus.INVESTIGATING:
        return 'warning';
      case SecurityEventStatus.RESOLVED:
        return 'success';
      case SecurityEventStatus.FALSE_POSITIVE:
        return 'info';
      case SecurityEventStatus.IGNORED:
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Time',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2">
          {format(new Date(params.value), 'MMM dd, HH:mm:ss')}
        </Typography>
      ),
    },
    {
      field: 'type',
      headerName: 'Event Type',
      width: 180,
      renderCell: (params) => (
        <Chip
          label={params.value.replace(/_/g, ' ').toUpperCase()}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          size="small"
          color={getSeverityColor(params.value)}
        />
      ),
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeviceIcon fontSize="small" />
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'sourceIp',
      headerName: 'IP Address',
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationIcon fontSize="small" />
          <Typography variant="body2" fontFamily="monospace">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'username',
      headerName: 'User',
      width: 120,
      renderCell: (params) => (
        params.value ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" />
            <Typography variant="body2" noWrap>
              {params.value}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
        )
      ),
    },
    {
      field: 'riskScore',
      headerName: 'Risk Score',
      width: 120,
      renderCell: (params) => (
        <Badge
          badgeContent={params.value}
          color={params.value >= 8 ? 'error' : params.value >= 6 ? 'warning' : 'success'}
          max={10}
        >
          <Box sx={{ width: 20, height: 20 }} />
        </Badge>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value.replace(/_/g, ' ').toUpperCase()}
          size="small"
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={<VisibilityIcon />}
          label="View Details"
          onClick={() => handleViewDetails(params.row)}
        />,
        ...(canManageSecurity ? [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Update Status"
            onClick={() => handleUpdateStatus(params.row)}
          />,
          <GridActionsCellItem
            icon={<MoreVertIcon />}
            label="More Actions"
            onClick={(event) => handleContextMenu(event, params.row.id)}
          />,
        ] : []),
      ],
    },
  ];

  const handleViewDetails = (event: SecurityEvent) => {
    setSelectedEvent(event);
    setDetailsDialogOpen(true);
  };

  const handleUpdateStatus = (event: SecurityEvent) => {
    setSelectedEvent(event);
    setNewStatus(event.status);
    setStatusDialogOpen(true);
  };

  const handleContextMenu = (event: React.MouseEvent, eventId: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      eventId,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleStatusUpdate = () => {
    if (selectedEvent) {
      updateStatusMutation.mutate({
        id: selectedEvent.id,
        status: newStatus,
        notes: statusNotes,
      });
    }
  };

  const handleBulkStatusUpdate = (status: SecurityEventStatus) => {
    if (selectionModel.length > 0) {
      bulkUpdateMutation.mutate({
        ids: selectionModel as string[],
        status,
      });
    }
  };

  const rows = eventsData?.events || [];

  if (error) {
    return (
      <Alert severity="error">
        Failed to load security events: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Severity</InputLabel>
          <Select
            value={filters.severity}
            label="Severity"
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value={SecuritySeverity.CRITICAL}>Critical</MenuItem>
            <MenuItem value={SecuritySeverity.HIGH}>High</MenuItem>
            <MenuItem value={SecuritySeverity.MEDIUM}>Medium</MenuItem>
            <MenuItem value={SecuritySeverity.LOW}>Low</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value={SecurityEventStatus.OPEN}>Open</MenuItem>
            <MenuItem value={SecurityEventStatus.INVESTIGATING}>Investigating</MenuItem>
            <MenuItem value={SecurityEventStatus.RESOLVED}>Resolved</MenuItem>
            <MenuItem value={SecurityEventStatus.FALSE_POSITIVE}>False Positive</MenuItem>
            <MenuItem value={SecurityEventStatus.IGNORED}>Ignored</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Bulk Actions */}
      {selectionModel.length > 0 && canManageSecurity && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<ResolveIcon />}
            onClick={() => handleBulkStatusUpdate(SecurityEventStatus.RESOLVED)}
          >
            Mark as Resolved ({selectionModel.length})
          </Button>
          <Button
            size="small"
            startIcon={<IgnoreIcon />}
            onClick={() => handleBulkStatusUpdate(SecurityEventStatus.IGNORED)}
          >
            Ignore ({selectionModel.length})
          </Button>
          <Button
            size="small"
            startIcon={<FlagIcon />}
            onClick={() => handleBulkStatusUpdate(SecurityEventStatus.INVESTIGATING)}
          >
            Mark as Investigating ({selectionModel.length})
          </Button>
        </Box>
      )}

      {/* Data Grid */}
      <Paper>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          paginationMode="server"
          rowCount={eventsData?.total || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection={canManageSecurity}
          rowSelectionModel={selectionModel}
          onRowSelectionModelChange={setSelectionModel}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          sx={{ height }}
        />
      </Paper>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => {
          const event = rows.find(r => r.id === contextMenu?.eventId);
          if (event) handleViewDetails(event);
          handleCloseContextMenu();
        }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        {canManageSecurity && (
          <>
            <Divider />
            <MenuItem onClick={() => {
              const event = rows.find(r => r.id === contextMenu?.eventId);
              if (event) {
                updateStatusMutation.mutate({
                  id: event.id,
                  status: SecurityEventStatus.RESOLVED,
                });
              }
              handleCloseContextMenu();
            }}>
              <ListItemIcon>
                <ResolveIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Mark as Resolved</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => {
              const event = rows.find(r => r.id === contextMenu?.eventId);
              if (event) {
                updateStatusMutation.mutate({
                  id: event.id,
                  status: SecurityEventStatus.FALSE_POSITIVE,
                });
              }
              handleCloseContextMenu();
            }}>
              <ListItemIcon>
                <IgnoreIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Mark as False Positive</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Event Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Security Event Details</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Event ID"
                  value={selectedEvent.id}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Timestamp"
                  value={format(new Date(selectedEvent.timestamp), 'PPpp')}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Type"
                  value={selectedEvent.type}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Severity"
                  value={selectedEvent.severity}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Source IP"
                  value={selectedEvent.sourceIp}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Risk Score"
                  value={selectedEvent.riskScore}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Box>
              <TextField
                label="Description"
                value={selectedEvent.description}
                InputProps={{ readOnly: true }}
                multiline
                rows={3}
              />
              {selectedEvent.geolocation && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Geolocation
                  </Typography>
                  <Typography variant="body2">
                    {selectedEvent.geolocation.city}, {selectedEvent.geolocation.region}, {selectedEvent.geolocation.country}
                  </Typography>
                </Box>
              )}
              {selectedEvent.metadata && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Metadata
                  </Typography>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
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

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Event Status</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newStatus}
                label="Status"
                onChange={(e) => setNewStatus(e.target.value as SecurityEventStatus)}
              >
                <MenuItem value={SecurityEventStatus.OPEN}>Open</MenuItem>
                <MenuItem value={SecurityEventStatus.INVESTIGATING}>Investigating</MenuItem>
                <MenuItem value={SecurityEventStatus.RESOLVED}>Resolved</MenuItem>
                <MenuItem value={SecurityEventStatus.FALSE_POSITIVE}>False Positive</MenuItem>
                <MenuItem value={SecurityEventStatus.IGNORED}>Ignored</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notes (Optional)"
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityEventsTable;