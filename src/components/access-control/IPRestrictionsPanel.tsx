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
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stack,
  CircularProgress,
  Autocomplete,
  Tabs,
  Tab,
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid/models';
import {
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  Public as PublicIcon,
  VpnLock as VpnIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { accessControlService } from '../../services/accessControlService';
import type { IPRestriction, IPRestrictionSettings, GeolocationInfo } from '../../types/accessControl';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission } from '../../types/permissions';

interface IPRestrictionDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'whitelist' | 'blacklist';
  restriction?: IPRestriction;
  onSuccess: () => void;
}

const IPRestrictionDialog: React.FC<IPRestrictionDialogProps> = ({
  open,
  onClose,
  type,
  restriction,
  onSuccess,
}) => {
  const [ipAddress, setIpAddress] = useState(restriction?.ipAddress || '');
  const [description, setDescription] = useState(restriction?.description || '');
  const [expiresAt, setExpiresAt] = useState(
    restriction?.expiresAt ? format(new Date(restriction.expiresAt), 'yyyy-MM-dd') : ''
  );
  const [geolocationInfo, setGeolocationInfo] = useState<GeolocationInfo | null>(null);
  const [checkingIP, setCheckingIP] = useState(false);

  const addRestrictionMutation = useMutation({
    mutationFn: (data: Omit<IPRestriction, 'id' | 'createdAt'>) =>
      accessControlService.addIPRestriction(type, data),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const updateRestrictionMutation = useMutation({
    mutationFn: (data: Partial<IPRestriction>) =>
      accessControlService.updateIPRestriction(restriction!.id, data),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const checkIPInfo = async () => {
    if (!ipAddress) return;
    
    setCheckingIP(true);
    try {
      const info = await accessControlService.getGeolocationInfo(ipAddress);
      setGeolocationInfo(info);
    } catch (error) {
      console.error('Failed to get IP info:', error);
    } finally {
      setCheckingIP(false);
    }
  };

  const handleSubmit = () => {
    const data = {
      ipAddress,
      description,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive: true,
      createdBy: 'current-user', // This should come from auth context
    };

    if (restriction) {
      updateRestrictionMutation.mutate(data);
    } else {
      addRestrictionMutation.mutate(data);
    }
  };

  const isValid = ipAddress && description;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {restriction ? 'Edit' : 'Add'} IP {type === 'whitelist' ? 'Whitelist' : 'Blacklist'} Entry
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="IP Address or CIDR"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.1.1 or 192.168.1.0/24"
                helperText="Enter a single IP address or CIDR notation for IP ranges"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={checkIPInfo}
                disabled={!ipAddress || checkingIP}
                sx={{ height: '56px' }}
              >
                {checkingIP ? <CircularProgress size={20} /> : 'Check IP Info'}
              </Button>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Reason for this restriction"
            multiline
            rows={2}
          />

          <TextField
            fullWidth
            label="Expires At (Optional)"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Leave empty for permanent restriction"
          />

          {geolocationInfo && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  IP Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Location: {geolocationInfo.city}, {geolocationInfo.region}, {geolocationInfo.country}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      ISP: {geolocationInfo.isp}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Organization: {geolocationInfo.organization}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {geolocationInfo.isVPN && <Chip size="small" label="VPN" color="warning" />}
                      {geolocationInfo.isProxy && <Chip size="small" label="Proxy" color="warning" />}
                      {geolocationInfo.isTor && <Chip size="small" label="Tor" color="error" />}
                      <Chip
                        size="small"
                        label={`Threat: ${geolocationInfo.threatLevel}`}
                        color={
                          geolocationInfo.threatLevel === 'critical' ? 'error' :
                          geolocationInfo.threatLevel === 'high' ? 'warning' :
                          geolocationInfo.threatLevel === 'medium' ? 'info' : 'success'
                        }
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {(addRestrictionMutation.error || updateRestrictionMutation.error) && (
            <Alert severity="error">
              {addRestrictionMutation.error?.message || updateRestrictionMutation.error?.message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || addRestrictionMutation.isPending || updateRestrictionMutation.isPending}
        >
          {(addRestrictionMutation.isPending || updateRestrictionMutation.isPending) ? (
            <CircularProgress size={20} />
          ) : (
            restriction ? 'Update' : 'Add'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const IPRestrictionsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'whitelist' | 'blacklist'>('whitelist');
  const [selectedRestriction, setSelectedRestriction] = useState<IPRestriction | undefined>();
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Fetch IP restriction settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['ip-restriction-settings'],
    queryFn: accessControlService.getIPRestrictionSettings,
  });

  // Fetch whitelist
  const { data: whitelist, isLoading: whitelistLoading } = useQuery({
    queryKey: ['ip-restrictions', 'whitelist'],
    queryFn: () => accessControlService.getIPRestrictions('whitelist'),
  });

  // Fetch blacklist
  const { data: blacklist, isLoading: blacklistLoading } = useQuery({
    queryKey: ['ip-restrictions', 'blacklist'],
    queryFn: () => accessControlService.getIPRestrictions('blacklist'),
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: accessControlService.updateIPRestrictionSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-restriction-settings'] });
    },
  });

  // Delete restriction mutation
  const deleteRestrictionMutation = useMutation({
    mutationFn: accessControlService.deleteIPRestriction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-restrictions'] });
    },
  });

  const handleDeleteRestriction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this IP restriction?')) {
      deleteRestrictionMutation.mutate(id);
    }
  };

  const handleEditRestriction = (restriction: IPRestriction, type: 'whitelist' | 'blacklist') => {
    setSelectedRestriction(restriction);
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleAddRestriction = (type: 'whitelist' | 'blacklist') => {
    setSelectedRestriction(undefined);
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRestriction(undefined);
  };

  const handleDialogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['ip-restrictions'] });
  };

  const createColumns = (type: 'whitelist' | 'blacklist'): GridColDef[] => [
    {
      field: 'ipAddress',
      headerName: 'IP Address/CIDR',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PublicIcon fontSize="small" />
          <Typography variant="body2" fontFamily="monospace">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 300,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          icon={params.value ? <CheckCircleIcon /> : <CancelIcon />}
        />
      ),
    },
    {
      field: 'createdBy',
      headerName: 'Created By',
      width: 150,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      renderCell: (params) => format(new Date(params.value), 'MMM dd, yyyy'),
    },
    {
      field: 'expiresAt',
      headerName: 'Expires',
      width: 150,
      renderCell: (params) => 
        params.value ? format(new Date(params.value), 'MMM dd, yyyy') : 'Never',
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEditRestriction(params.row, type)}
          disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteRestriction(params.row.id)}
          disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG)}
        />,
      ],
    },
  ];

  const CustomToolbar = ({ type }: { type: 'whitelist' | 'blacklist' }) => (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
      <GridToolbarExport />
      <Box sx={{ flexGrow: 1 }} />
      <Button
        startIcon={<AddIcon />}
        onClick={() => handleAddRestriction(type)}
        disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG)}
      >
        Add {type === 'whitelist' ? 'Whitelist' : 'Blacklist'} Entry
      </Button>
    </GridToolbarContainer>
  );

  if (settingsLoading || whitelistLoading || blacklistLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        IP Restrictions & Geolocation Blocking
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Settings Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">IP Restriction Settings</Typography>
              </Box>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.enabled || false}
                      onChange={(e) =>
                        updateSettingsMutation.mutate({ enabled: e.target.checked })
                      }
                      disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG)}
                    />
                  }
                  label="Enable IP Restrictions"
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Restriction Mode</InputLabel>
                  <Select
                    value={settings?.mode || 'blacklist'}
                    onChange={(e) =>
                      updateSettingsMutation.mutate({ mode: e.target.value as 'whitelist' | 'blacklist' })
                    }
                    label="Restriction Mode"
                    disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG) || !settings?.enabled}
                  >
                    <MenuItem value="whitelist">Whitelist (Allow only listed IPs)</MenuItem>
                    <MenuItem value="blacklist">Blacklist (Block listed IPs)</MenuItem>
                  </Select>
                </FormControl>

                <Divider />

                <Typography variant="subtitle2">Rate Limiting:</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.rateLimit?.enabled || false}
                      onChange={(e) =>
                        updateSettingsMutation.mutate({
                          rateLimit: { ...settings?.rateLimit, enabled: e.target.checked }
                        })
                      }
                      disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG)}
                    />
                  }
                  label="Enable Rate Limiting"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Geolocation Settings Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationIcon color="primary" />
                <Typography variant="h6">Geolocation Blocking</Typography>
              </Box>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.geolocationBlocking?.enabled || false}
                      onChange={(e) =>
                        updateSettingsMutation.mutate({
                          geolocationBlocking: {
                            ...settings?.geolocationBlocking,
                            enabled: e.target.checked
                          }
                        })
                      }
                      disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG)}
                    />
                  }
                  label="Enable Geolocation Blocking"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.geolocationBlocking?.allowVPN || false}
                      onChange={(e) =>
                        updateSettingsMutation.mutate({
                          geolocationBlocking: {
                            ...settings?.geolocationBlocking,
                            allowVPN: e.target.checked
                          }
                        })
                      }
                      disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG) || !settings?.geolocationBlocking?.enabled}
                    />
                  }
                  label="Allow VPN Connections"
                />

                <Typography variant="body2" color="text.secondary">
                  Blocked Countries: {settings?.geolocationBlocking?.blockedCountries?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Blocked Regions: {settings?.geolocationBlocking?.blockedRegions?.length || 0}
                </Typography>

                <Button
                  startIcon={<SettingsIcon />}
                  size="small"
                  onClick={() => setSettingsDialogOpen(true)}
                  disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG)}
                >
                  Configure Geolocation
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* IP Restrictions Tables */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon />
                  Whitelist ({whitelist?.length || 0})
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BlockIcon />
                  Blacklist ({blacklist?.length || 0})
                </Box>
              }
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: 600 }}>
            <DataGrid
              rows={whitelist || []}
              columns={createColumns('whitelist')}
              slots={{
                toolbar: () => <CustomToolbar type="whitelist" />,
              }}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
              }}
              pageSizeOptions={[25, 50, 100]}
              checkboxSelection
              disableRowSelectionOnClick
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ height: 600 }}>
            <DataGrid
              rows={blacklist || []}
              columns={createColumns('blacklist')}
              slots={{
                toolbar: () => <CustomToolbar type="blacklist" />,
              }}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
              }}
              pageSizeOptions={[25, 50, 100]}
              checkboxSelection
              disableRowSelectionOnClick
            />
          </Box>
        </TabPanel>
      </Paper>

      {/* IP Restriction Dialog */}
      <IPRestrictionDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        type={dialogType}
        restriction={selectedRestriction}
        onSuccess={handleDialogSuccess}
      />
    </Box>
  );
};

export default IPRestrictionsPanel;