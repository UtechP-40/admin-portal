import React, { useState } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Card,
  CardContent,
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
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { securityService } from '../../services/securityService';
import {
  SecurityThreat,
  SecuritySeverity,
  ThreatStatus,
  ThreatCategory,
} from '../../types/security';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types/permissions';

interface SecurityThreatsTableProps {
  threats: SecurityThreat[];
  height?: number;
}

const SecurityThreatsTable: React.FC<SecurityThreatsTableProps> = ({ threats, height = 600 }) => {
  const [selectedThreat, setSelectedThreat] = useState<SecurityThreat | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ThreatStatus>(ThreatStatus.ACTIVE);
  const [statusNotes, setStatusNotes] = useState('');

  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManageSecurity = hasPermission(Permission.SECURITY_MANAGE);

  // Mutations
  const updateThreatStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: ThreatStatus; notes?: string }) =>
      securityService.updateThreatStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security'] });
      setStatusDialogOpen(false);
      setStatusNotes('');
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

  const getStatusColor = (status: ThreatStatus) => {
    switch (status) {
      case ThreatStatus.ACTIVE:
        return 'error';
      case ThreatStatus.MONITORING:
        return 'warning';
      case ThreatStatus.MITIGATED:
        return 'info';
      case ThreatStatus.RESOLVED:
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: ThreatStatus) => {
    switch (status) {
      case ThreatStatus.ACTIVE:
        return <WarningIcon color="error" />;
      case ThreatStatus.MONITORING:
        return <TimelineIcon color="warning" />;
      case ThreatStatus.MITIGATED:
        return <SecurityIcon color="info" />;
      case ThreatStatus.RESOLVED:
        return <CheckCircleIcon color="success" />;
      default:
        return <SecurityIcon />;
    }
  };

  const getCategoryIcon = (category: ThreatCategory) => {
    switch (category) {
      case ThreatCategory.AUTHENTICATION:
        return <SecurityIcon />;
      case ThreatCategory.AUTHORIZATION:
        return <SecurityIcon />;
      case ThreatCategory.DATA_PROTECTION:
        return <SecurityIcon />;
      case ThreatCategory.NETWORK_SECURITY:
        return <SecurityIcon />;
      case ThreatCategory.APPLICATION_SECURITY:
        return <SecurityIcon />;
      case ThreatCategory.SYSTEM_INTEGRITY:
        return <AssessmentIcon />;
      case ThreatCategory.COMPLIANCE:
        return <CheckCircleIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Threat Name',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getCategoryIcon(params.value)}
          <Typography variant="body2" noWrap>
            {params.value.replace(/_/g, ' ').toUpperCase()}
          </Typography>
        </Box>
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
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon(params.value)}
          <Chip
            label={params.value.replace(/_/g, ' ').toUpperCase()}
            size="small"
            color={getStatusColor(params.value)}
          />
        </Box>
      ),
    },
    {
      field: 'riskScore',
      headerName: 'Risk Score',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight="bold">
            {params.value.toFixed(1)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            /10
          </Typography>
        </Box>
      ),
    },
    {
      field: 'eventCount',
      headerName: 'Events',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'firstDetected',
      headerName: 'First Detected',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2">
          {format(new Date(params.value), 'MMM dd, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'lastDetected',
      headerName: 'Last Detected',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2">
          {format(new Date(params.value), 'MMM dd, HH:mm')}
        </Typography>
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
        ] : []),
      ],
    },
  ];

  const handleViewDetails = (threat: SecurityThreat) => {
    setSelectedThreat(threat);
    setDetailsDialogOpen(true);
  };

  const handleUpdateStatus = (threat: SecurityThreat) => {
    setSelectedThreat(threat);
    setNewStatus(threat.status);
    setStatusDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (selectedThreat) {
      updateThreatStatusMutation.mutate({
        id: selectedThreat.id,
        status: newStatus,
        notes: statusNotes,
      });
    }
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        {Object.values(ThreatStatus).map((status) => {
          const count = threats.filter(t => t.status === status).length;
          return (
            <Card key={status}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getStatusIcon(status)}
                <Box>
                  <Typography variant="h6">{count}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {status.replace(/_/g, ' ')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Data Grid */}
      <Paper>
        <DataGrid
          rows={threats}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: {
              sortModel: [{ field: 'riskScore', sort: 'desc' }],
            },
          }}
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

      {/* Threat Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Threat Details</DialogTitle>
        <DialogContent>
          {selectedThreat && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Threat ID"
                  value={selectedThreat.id}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Category"
                  value={selectedThreat.category}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Severity"
                  value={selectedThreat.severity}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Status"
                  value={selectedThreat.status}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Risk Score"
                  value={selectedThreat.riskScore}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Event Count"
                  value={selectedThreat.eventCount}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="First Detected"
                  value={format(new Date(selectedThreat.firstDetected), 'PPpp')}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <TextField
                  label="Last Detected"
                  value={format(new Date(selectedThreat.lastDetected), 'PPpp')}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Box>
              <TextField
                label="Name"
                value={selectedThreat.name}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                label="Description"
                value={selectedThreat.description}
                InputProps={{ readOnly: true }}
                multiline
                rows={3}
                fullWidth
              />
              
              {/* Indicators */}
              {selectedThreat.indicators.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Indicators of Compromise
                  </Typography>
                  <List dense>
                    {selectedThreat.indicators.map((indicator, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <WarningIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={indicator} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Mitigation Steps */}
              {selectedThreat.mitigationSteps.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Mitigation Steps
                  </Typography>
                  <List dense>
                    {selectedThreat.mitigationSteps.map((step, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircleIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={step} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Affected Systems */}
              {selectedThreat.affectedSystems.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Affected Systems
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedThreat.affectedSystems.map((system, index) => (
                      <Chip key={index} label={system} size="small" variant="outlined" />
                    ))}
                  </Box>
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
        <DialogTitle>Update Threat Status</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newStatus}
                label="Status"
                onChange={(e) => setNewStatus(e.target.value as ThreatStatus)}
              >
                <MenuItem value={ThreatStatus.ACTIVE}>Active</MenuItem>
                <MenuItem value={ThreatStatus.MONITORING}>Monitoring</MenuItem>
                <MenuItem value={ThreatStatus.MITIGATED}>Mitigated</MenuItem>
                <MenuItem value={ThreatStatus.RESOLVED}>Resolved</MenuItem>
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
            disabled={updateThreatStatusMutation.isPending}
          >
            {updateThreatStatusMutation.isPending ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityThreatsTable;