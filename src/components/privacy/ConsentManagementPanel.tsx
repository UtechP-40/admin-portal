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
  CheckCircle as ApproveIcon,
  Cancel as RevokeIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { privacyService } from '../../services/privacyService';
import { ConsentType } from '../../types/privacy';
import type { ConsentRecord } from '../../types/privacy';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission } from '../../types/permissions';

const ConsentManagementPanel: React.FC = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedConsent, setSelectedConsent] = useState<ConsentRecord | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newGranted, setNewGranted] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [filters, setFilters] = useState({
    consentType: '',
    granted: '',
    search: '',
  });

  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManagePrivacy = hasPermission(Permission.SECURITY_MANAGE);

  // Query for consent records
  const { data: consentsData, isLoading, error } = useQuery({
    queryKey: ['privacy', 'consent', page, pageSize, filters],
    queryFn: () => privacyService.getConsentRecords({
      page: page + 1,
      limit: pageSize,
      consentType: filters.consentType as ConsentType || undefined,
      granted: filters.granted ? filters.granted === 'true' : undefined,
    }),
  });

  // Mutations
  const updateConsentMutation = useMutation({
    mutationFn: ({ id, granted, notes }: { id: string; granted: boolean; notes?: string }) =>
      privacyService.updateConsent(id, granted, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy', 'consent'] });
      setUpdateDialogOpen(false);
      setUpdateNotes('');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, granted, notes }: { ids: string[]; granted: boolean; notes?: string }) =>
      privacyService.bulkUpdateConsents(ids, granted, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy', 'consent'] });
      setSelectionModel([]);
    },
  });

  const getConsentTypeColor = (type: ConsentType) => {
    switch (type) {
      case ConsentType.DATA_PROCESSING:
        return 'primary';
      case ConsentType.MARKETING:
        return 'secondary';
      case ConsentType.ANALYTICS:
        return 'info';
      case ConsentType.COOKIES:
        return 'warning';
      case ConsentType.THIRD_PARTY_SHARING:
        return 'error';
      case ConsentType.PROFILING:
        return 'default';
      default:
        return 'default';
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
      field: 'consentType',
      headerName: 'Consent Type',
      width: 160,
      renderCell: (params) => (
        <Chip
          label={params.value.replace(/_/g, ' ').toUpperCase()}
          size="small"
          color={getConsentTypeColor(params.value)}
        />
      ),
    },
    {
      field: 'purpose',
      headerName: 'Purpose',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'granted',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Granted' : 'Revoked'}
          size="small"
          color={params.value ? 'success' : 'error'}
          icon={params.value ? <ApproveIcon /> : <RevokeIcon />}
        />
      ),
    },
    {
      field: 'grantedAt',
      headerName: 'Granted At',
      width: 140,
      renderCell: (params) => (
        params.value ? (
          <Typography variant="body2">
            {format(new Date(params.value), 'MMM dd, yyyy')}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
        )
      ),
    },
    {
      field: 'revokedAt',
      headerName: 'Revoked At',
      width: 140,
      renderCell: (params) => (
        params.value ? (
          <Typography variant="body2">
            {format(new Date(params.value), 'MMM dd, yyyy')}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
        )
      ),
    },
    {
      field: 'expiresAt',
      headerName: 'Expires',
      width: 140,
      renderCell: (params) => (
        params.value ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon fontSize="small" />
            <Typography variant="body2">
              {format(new Date(params.value), 'MMM dd, yyyy')}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Never
          </Typography>
        )
      ),
    },
    {
      field: 'version',
      headerName: 'Version',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
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
        ...(canManagePrivacy ? [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Update Consent"
            onClick={() => handleUpdateConsent(params.row)}
          />,
        ] : []),
      ],
    },
  ];

  const handleViewDetails = (consent: ConsentRecord) => {
    setSelectedConsent(consent);
    setDetailsDialogOpen(true);
  };

  const handleUpdateConsent = (consent: ConsentRecord) => {
    setSelectedConsent(consent);
    setNewGranted(!consent.granted);
    setUpdateDialogOpen(true);
  };

  const handleConsentUpdate = () => {
    if (selectedConsent) {
      updateConsentMutation.mutate({
        id: selectedConsent.id,
        granted: newGranted,
        notes: updateNotes,
      });
    }
  };

  const handleBulkUpdate = (granted: boolean) => {
    if (selectionModel.length > 0) {
      bulkUpdateMutation.mutate({
        ids: selectionModel as string[],
        granted,
      });
    }
  };

  const rows = consentsData?.records || [];

  if (error) {
    return (
      <Alert severity="error">
        Failed to load consent records: {error.message}
      </Alert>
    );
  }

  // Summary statistics
  const totalConsents = consentsData?.total || 0;
  const grantedConsents = rows.filter(r => r.granted).length;
  const revokedConsents = rows.filter(r => !r.granted).length;
  const expiringSoon = rows.filter(r => 
    r.expiresAt && new Date(r.expiresAt) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {totalConsents.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Consents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {grantedConsents.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Consents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {revokedConsents.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Revoked Consents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {expiringSoon}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expiring Soon
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
          <InputLabel>Consent Type</InputLabel>
          <Select
            value={filters.consentType}
            label="Consent Type"
            onChange={(e) => setFilters({ ...filters, consentType: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value={ConsentType.DATA_PROCESSING}>Data Processing</MenuItem>
            <MenuItem value={ConsentType.MARKETING}>Marketing</MenuItem>
            <MenuItem value={ConsentType.ANALYTICS}>Analytics</MenuItem>
            <MenuItem value={ConsentType.COOKIES}>Cookies</MenuItem>
            <MenuItem value={ConsentType.THIRD_PARTY_SHARING}>Third Party Sharing</MenuItem>
            <MenuItem value={ConsentType.PROFILING}>Profiling</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.granted}
            label="Status"
            onChange={(e) => setFilters({ ...filters, granted: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Granted</MenuItem>
            <MenuItem value="false">Revoked</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Bulk Actions */}
      {selectionModel.length > 0 && canManagePrivacy && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<ApproveIcon />}
            onClick={() => handleBulkUpdate(true)}
            color="success"
          >
            Grant Consent ({selectionModel.length})
          </Button>
          <Button
            size="small"
            startIcon={<RevokeIcon />}
            onClick={() => handleBulkUpdate(false)}
            color="error"
          >
            Revoke Consent ({selectionModel.length})
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
          rowCount={consentsData?.total || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection={canManagePrivacy}
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
          sx={{ height: 600 }}
        />
      </Paper>

      {/* Consent Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Consent Record Details</DialogTitle>
        <DialogContent>
          {selectedConsent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Consent ID"
                  value={selectedConsent.id}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="User ID"
                  value={selectedConsent.userId}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Username"
                  value={selectedConsent.username}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Email"
                  value={selectedConsent.email}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Consent Type"
                  value={selectedConsent.consentType}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Status"
                  value={selectedConsent.granted ? 'Granted' : 'Revoked'}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Version"
                  value={selectedConsent.version}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="IP Address"
                  value={selectedConsent.ipAddress}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Box>
              <TextField
                label="Purpose"
                value={selectedConsent.purpose}
                InputProps={{ readOnly: true }}
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="User Agent"
                value={selectedConsent.userAgent}
                InputProps={{ readOnly: true }}
                multiline
                rows={2}
                fullWidth
              />
              {selectedConsent.grantedAt && (
                <TextField
                  label="Granted At"
                  value={format(new Date(selectedConsent.grantedAt), 'PPpp')}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              )}
              {selectedConsent.revokedAt && (
                <TextField
                  label="Revoked At"
                  value={format(new Date(selectedConsent.revokedAt), 'PPpp')}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              )}
              {selectedConsent.expiresAt && (
                <TextField
                  label="Expires At"
                  value={format(new Date(selectedConsent.expiresAt), 'PPpp')}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              )}
              {selectedConsent.metadata && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Metadata
                  </Typography>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(selectedConsent.metadata, null, 2)}
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

      {/* Update Consent Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Consent</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {selectedConsent && (
              <Alert severity="info">
                <Typography variant="body2">
                  Updating consent for <strong>{selectedConsent.username}</strong> ({selectedConsent.email})
                </Typography>
                <Typography variant="body2">
                  Consent Type: <strong>{selectedConsent.consentType.replace(/_/g, ' ')}</strong>
                </Typography>
                <Typography variant="body2">
                  New Status: <strong>{newGranted ? 'Granted' : 'Revoked'}</strong>
                </Typography>
              </Alert>
            )}
            <TextField
              label="Notes (Optional)"
              value={updateNotes}
              onChange={(e) => setUpdateNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
              placeholder="Reason for consent update..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConsentUpdate}
            variant="contained"
            disabled={updateConsentMutation.isPending}
            color={newGranted ? 'success' : 'error'}
          >
            {updateConsentMutation.isPending ? 'Updating...' : (newGranted ? 'Grant Consent' : 'Revoke Consent')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConsentManagementPanel;