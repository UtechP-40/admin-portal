import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridToolbar,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Gavel as GavelIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { privacyService } from '../../services/privacyService';
import {
  DataSubjectRequest,
  DataSubjectRequestType,
  DataSubjectRequestStatus,
  VerificationMethod,
} from '../../types/privacy';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types/permissions';

const DataSubjectRequestsPanel: React.FC = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedRequest, setSelectedRequest] = useState<DataSubjectRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<DataSubjectRequestStatus>(DataSubjectRequestStatus.PENDING);
  const [processNotes, setProcessNotes] = useState('');
  const [filters, setFilters] = useState({
    requestType: '',
    status: '',
    search: '',
  });

  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManagePrivacy = hasPermission(Permission.SECURITY_MANAGE);

  // Query for data subject requests
  const { data: requestsData, isLoading, error } = useQuery({
    queryKey: ['privacy', 'data-subject-requests', page, pageSize, filters],
    queryFn: () => privacyService.getDataSubjectRequests({
      page: page + 1,
      limit: pageSize,
      requestType: filters.requestType as DataSubjectRequestType || undefined,
      status: filters.status as DataSubjectRequestStatus || undefined,
    }),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: DataSubjectRequestStatus; notes?: string }) =>
      privacyService.updateDataSubjectRequestStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy', 'data-subject-requests'] });
      setProcessDialogOpen(false);
      setProcessNotes('');
    },
  });

  const processRequestMutation = useMutation({
    mutationFn: ({ id, responseData }: { id: string; responseData?: any }) =>
      privacyService.processDataSubjectRequest(id, responseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy', 'data-subject-requests'] });
      setProcessDialogOpen(false);
    },
  });

  const exportUserDataMutation = useMutation({
    mutationFn: (userId: string) => privacyService.exportUserData(userId),
    onSuccess: (blob, userId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  const deleteUserDataMutation = useMutation({
    mutationFn: (userId: string) => privacyService.deleteUserData(userId, { hardDelete: false, anonymize: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy', 'data-subject-requests'] });
    },
  });

  const getRequestTypeColor = (type: DataSubjectRequestType) => {
    switch (type) {
      case DataSubjectRequestType.ACCESS:
        return 'info';
      case DataSubjectRequestType.RECTIFICATION:
        return 'warning';
      case DataSubjectRequestType.ERASURE:
        return 'error';
      case DataSubjectRequestType.PORTABILITY:
        return 'primary';
      case DataSubjectRequestType.RESTRICTION:
        return 'secondary';
      case DataSubjectRequestType.OBJECTION:
        return 'default';
      case DataSubjectRequestType.WITHDRAW_CONSENT:
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: DataSubjectRequestStatus) => {
    switch (status) {
      case DataSubjectRequestStatus.PENDING:
        return 'warning';
      case DataSubjectRequestStatus.UNDER_REVIEW:
        return 'info';
      case DataSubjectRequestStatus.VERIFIED:
        return 'primary';
      case DataSubjectRequestStatus.IN_PROGRESS:
        return 'secondary';
      case DataSubjectRequestStatus.COMPLETED:
        return 'success';
      case DataSubjectRequestStatus.REJECTED:
        return 'error';
      case DataSubjectRequestStatus.EXPIRED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getRequestTypeIcon = (type: DataSubjectRequestType) => {
    switch (type) {
      case DataSubjectRequestType.ACCESS:
        return <VisibilityIcon />;
      case DataSubjectRequestType.RECTIFICATION:
        return <EditIcon />;
      case DataSubjectRequestType.ERASURE:
        return <DeleteIcon />;
      case DataSubjectRequestType.PORTABILITY:
        return <DownloadIcon />;
      case DataSubjectRequestType.RESTRICTION:
        return <SecurityIcon />;
      case DataSubjectRequestType.OBJECTION:
        return <GavelIcon />;
      case DataSubjectRequestType.WITHDRAW_CONSENT:
        return <CancelIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'username',
      headerName: 'User',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon fontSize="small" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon fontSize="small" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'requestType',
      headerName: 'Request Type',
      width: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getRequestTypeIcon(params.value)}
          <Chip
            label={params.value.replace(/_/g, ' ').toUpperCase()}
            size="small"
            color={getRequestTypeColor(params.value)}
          />
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value.replace(/_/g, ' ').toUpperCase()}
          size="small"
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'verificationMethod',
      headerName: 'Verification',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value.replace(/_/g, ' ').toUpperCase()}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'requestedAt',
      headerName: 'Requested',
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon fontSize="small" />
          <Typography variant="body2">
            {format(new Date(params.value), 'MMM dd, yyyy')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'processedAt',
      headerName: 'Processed',
      width: 140,
      renderCell: (params) => (
        params.value ? (
          <Typography variant="body2">
            {format(new Date(params.value), 'MMM dd, yyyy')}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Pending
          </Typography>
        )
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
      width: 150,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={<VisibilityIcon />}
          label="View Details"
          onClick={() => handleViewDetails(params.row)}
        />,
        ...(canManagePrivacy ? [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Process Request"
            onClick={() => handleProcessRequest(params.row)}
          />,
        ] : []),
      ],
    },
  ];

  const handleViewDetails = (request: DataSubjectRequest) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };

  const handleProcessRequest = (request: DataSubjectRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setProcessDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (selectedRequest) {
      updateStatusMutation.mutate({
        id: selectedRequest.id,
        status: newStatus,
        notes: processNotes,
      });
    }
  };

  const handleQuickAction = async (request: DataSubjectRequest, action: string) => {
    switch (action) {
      case 'export':
        exportUserDataMutation.mutate(request.userId);
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this user\'s data? This action cannot be undone.')) {
          deleteUserDataMutation.mutate(request.userId);
        }
        break;
      case 'approve':
        updateStatusMutation.mutate({
          id: request.id,
          status: DataSubjectRequestStatus.COMPLETED,
          notes: 'Request approved and processed',
        });
        break;
      case 'reject':
        updateStatusMutation.mutate({
          id: request.id,
          status: DataSubjectRequestStatus.REJECTED,
          notes: 'Request rejected',
        });
        break;
    }
  };

  const rows = requestsData?.requests || [];

  if (error) {
    return (
      <Alert severity="error">
        Failed to load data subject requests: {error.message}
      </Alert>
    );
  }

  // Summary statistics
  const totalRequests = requestsData?.total || 0;
  const pendingRequests = rows.filter(r => r.status === DataSubjectRequestStatus.PENDING).length;
  const completedRequests = rows.filter(r => r.status === DataSubjectRequestStatus.COMPLETED).length;
  const overdueRequests = rows.filter(r => 
    r.status !== DataSubjectRequestStatus.COMPLETED && 
    new Date(r.requestedAt) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {totalRequests.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {pendingRequests.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {completedRequests.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {overdueRequests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overdue (>30 days)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* GDPR Compliance Notice */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>GDPR Compliance:</strong> Data subject requests must be processed within 30 days. 
          Requests marked as overdue require immediate attention to maintain compliance.
        </Typography>
      </Alert>

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
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Request Type</InputLabel>
          <Select
            value={filters.requestType}
            label="Request Type"
            onChange={(e) => setFilters({ ...filters, requestType: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value={DataSubjectRequestType.ACCESS}>Access</MenuItem>
            <MenuItem value={DataSubjectRequestType.RECTIFICATION}>Rectification</MenuItem>
            <MenuItem value={DataSubjectRequestType.ERASURE}>Erasure</MenuItem>
            <MenuItem value={DataSubjectRequestType.PORTABILITY}>Portability</MenuItem>
            <MenuItem value={DataSubjectRequestType.RESTRICTION}>Restriction</MenuItem>
            <MenuItem value={DataSubjectRequestType.OBJECTION}>Objection</MenuItem>
            <MenuItem value={DataSubjectRequestType.WITHDRAW_CONSENT}>Withdraw Consent</MenuItem>
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
            <MenuItem value={DataSubjectRequestStatus.PENDING}>Pending</MenuItem>
            <MenuItem value={DataSubjectRequestStatus.UNDER_REVIEW}>Under Review</MenuItem>
            <MenuItem value={DataSubjectRequestStatus.VERIFIED}>Verified</MenuItem>
            <MenuItem value={DataSubjectRequestStatus.IN_PROGRESS}>In Progress</MenuItem>
            <MenuItem value={DataSubjectRequestStatus.COMPLETED}>Completed</MenuItem>
            <MenuItem value={DataSubjectRequestStatus.REJECTED}>Rejected</MenuItem>
            <MenuItem value={DataSubjectRequestStatus.EXPIRED}>Expired</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Data Grid */}
      <Paper>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          paginationMode="server"
          rowCount={requestsData?.total || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          sx={{ height: 600 }}
        />
      </Paper>

      {/* Request Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Data Subject Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Request ID"
                  value={selectedRequest.id}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="User ID"
                  value={selectedRequest.userId}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Username"
                  value={selectedRequest.username}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Email"
                  value={selectedRequest.email}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Request Type"
                  value={selectedRequest.requestType}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Status"
                  value={selectedRequest.status}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Verification Method"
                  value={selectedRequest.verificationMethod}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Processed By"
                  value={selectedRequest.processedBy || 'Not processed'}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Box>
              <TextField
                label="Description"
                value={selectedRequest.description}
                InputProps={{ readOnly: true }}
                multiline
                rows={3}
                fullWidth
              />
              <TextField
                label="Requested At"
                value={format(new Date(selectedRequest.requestedAt), 'PPpp')}
                InputProps={{ readOnly: true }}
                size="small"
              />
              {selectedRequest.processedAt && (
                <TextField
                  label="Processed At"
                  value={format(new Date(selectedRequest.processedAt), 'PPpp')}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              )}
              {selectedRequest.completedAt && (
                <TextField
                  label="Completed At"
                  value={format(new Date(selectedRequest.completedAt), 'PPpp')}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              )}
              {selectedRequest.notes && (
                <TextField
                  label="Notes"
                  value={selectedRequest.notes}
                  InputProps={{ readOnly: true }}
                  multiline
                  rows={2}
                  fullWidth
                />
              )}
              {selectedRequest.verificationData && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Verification Data
                  </Typography>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(selectedRequest.verificationData, null, 2)}
                  </pre>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {canManagePrivacy && selectedRequest && (
            <>
              {selectedRequest.requestType === DataSubjectRequestType.PORTABILITY && (
                <Button
                  onClick={() => handleQuickAction(selectedRequest, 'export')}
                  startIcon={<DownloadIcon />}
                  disabled={exportUserDataMutation.isPending}
                >
                  Export Data
                </Button>
              )}
              {selectedRequest.requestType === DataSubjectRequestType.ERASURE && (
                <Button
                  onClick={() => handleQuickAction(selectedRequest, 'delete')}
                  startIcon={<DeleteIcon />}
                  color="error"
                  disabled={deleteUserDataMutation.isPending}
                >
                  Delete Data
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Process Request Dialog */}
      <Dialog
        open={processDialogOpen}
        onClose={() => setProcessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Process Data Subject Request</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {selectedRequest && (
              <Alert severity="info">
                <Typography variant="body2">
                  Processing request from <strong>{selectedRequest.username}</strong> ({selectedRequest.email})
                </Typography>
                <Typography variant="body2">
                  Request Type: <strong>{selectedRequest.requestType.replace(/_/g, ' ')}</strong>
                </Typography>
              </Alert>
            )}
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                label="New Status"
                onChange={(e) => setNewStatus(e.target.value as DataSubjectRequestStatus)}
              >
                <MenuItem value={DataSubjectRequestStatus.PENDING}>Pending</MenuItem>
                <MenuItem value={DataSubjectRequestStatus.UNDER_REVIEW}>Under Review</MenuItem>
                <MenuItem value={DataSubjectRequestStatus.VERIFIED}>Verified</MenuItem>
                <MenuItem value={DataSubjectRequestStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={DataSubjectRequestStatus.COMPLETED}>Completed</MenuItem>
                <MenuItem value={DataSubjectRequestStatus.REJECTED}>Rejected</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Processing Notes"
              value={processNotes}
              onChange={(e) => setProcessNotes(e.target.value)}
              multiline
              rows={4}
              fullWidth
              placeholder="Add notes about the processing of this request..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? 'Processing...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataSubjectRequestsPanel;