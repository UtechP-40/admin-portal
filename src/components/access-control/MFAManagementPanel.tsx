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
  ListItemSecondaryAction,
  Divider,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridRowParams,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import {
  PhoneAndroid as PhoneIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Smartphone as SmartphoneIcon,
  Computer as ComputerIcon,
  Key as KeyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  QrCode as QrCodeIcon,
  Backup as BackupIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { accessControlService } from '../../services/accessControlService';
import type { MFADevice, MFAMethod, MultiFactorAuthSettings } from '../../types/accessControl';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types/permissions';

interface MFASetupDialogProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
  onSuccess: () => void;
}

const MFASetupDialog: React.FC<MFASetupDialogProps> = ({ open, onClose, userId, onSuccess }) => {
  const [method, setMethod] = useState<MFAMethod>(MFAMethod.TOTP);
  const [deviceName, setDeviceName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [setupData, setSetupData] = useState<any>(null);
  const [step, setStep] = useState<'setup' | 'verify'>('setup');

  const enableMFAMutation = useMutation({
    mutationFn: ({ userId, method, deviceName }: { userId: string; method: MFAMethod; deviceName: string }) =>
      accessControlService.enableMFAForUser(userId, method, deviceName),
    onSuccess: (data) => {
      setSetupData(data.setupData);
      setStep('verify');
    },
  });

  const verifyMFAMutation = useMutation({
    mutationFn: ({ deviceId, verificationCode }: { deviceId: string; verificationCode: string }) =>
      accessControlService.verifyMFASetup(deviceId, verificationCode),
    onSuccess: () => {
      onSuccess();
      handleClose();
    },
  });

  const handleClose = () => {
    setMethod(MFAMethod.TOTP);
    setDeviceName('');
    setVerificationCode('');
    setSetupData(null);
    setStep('setup');
    onClose();
  };

  const handleSetup = () => {
    if (userId) {
      enableMFAMutation.mutate({ userId, method, deviceName });
    }
  };

  const handleVerify = () => {
    if (setupData?.device?.id) {
      verifyMFAMutation.mutate({ deviceId: setupData.device.id, verificationCode });
    }
  };

  const getMethodIcon = (method: MFAMethod) => {
    switch (method) {
      case MFAMethod.TOTP:
        return <SmartphoneIcon />;
      case MFAMethod.SMS:
        return <PhoneIcon />;
      case MFAMethod.EMAIL:
        return <EmailIcon />;
      case MFAMethod.HARDWARE_TOKEN:
        return <KeyIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {step === 'setup' ? 'Enable Multi-Factor Authentication' : 'Verify MFA Setup'}
      </DialogTitle>
      <DialogContent>
        {step === 'setup' ? (
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Authentication Method</InputLabel>
              <Select
                value={method}
                onChange={(e) => setMethod(e.target.value as MFAMethod)}
                label="Authentication Method"
              >
                <MenuItem value={MFAMethod.TOTP}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartphoneIcon />
                    Authenticator App (TOTP)
                  </Box>
                </MenuItem>
                <MenuItem value={MFAMethod.SMS}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon />
                    SMS
                  </Box>
                </MenuItem>
                <MenuItem value={MFAMethod.EMAIL}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon />
                    Email
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Device Name"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g., iPhone 12, Work Phone"
              helperText="Give this device a memorable name"
            />

            {enableMFAMutation.error && (
              <Alert severity="error">
                {enableMFAMutation.error.message}
              </Alert>
            )}
          </Stack>
        ) : (
          <Stack spacing={3} sx={{ mt: 1 }}>
            {method === MFAMethod.TOTP && setupData?.qrCode && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" gutterBottom>
                  Scan this QR code with your authenticator app:
                </Typography>
                <Box
                  component="img"
                  src={setupData.qrCode}
                  alt="QR Code"
                  sx={{ maxWidth: 200, height: 'auto', mx: 'auto', display: 'block' }}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  Or enter this secret manually: {setupData.secret}
                </Typography>
              </Box>
            )}

            {method === MFAMethod.SMS && (
              <Alert severity="info">
                A verification code has been sent to your phone number.
              </Alert>
            )}

            {method === MFAMethod.EMAIL && (
              <Alert severity="info">
                A verification code has been sent to your email address.
              </Alert>
            )}

            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              inputProps={{ maxLength: 6 }}
            />

            {verifyMFAMutation.error && (
              <Alert severity="error">
                {verifyMFAMutation.error.message}
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {step === 'setup' ? (
          <Button
            onClick={handleSetup}
            variant="contained"
            disabled={!deviceName || enableMFAMutation.isPending}
          >
            {enableMFAMutation.isPending ? <CircularProgress size={20} /> : 'Setup MFA'}
          </Button>
        ) : (
          <Button
            onClick={handleVerify}
            variant="contained"
            disabled={!verificationCode || verifyMFAMutation.isPending}
          >
            {verifyMFAMutation.isPending ? <CircularProgress size={20} /> : 'Verify'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const MFAManagementPanel: React.FC = () => {  
 const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Fetch MFA settings
  const { data: mfaSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['mfa-settings'],
    queryFn: accessControlService.getMFASettings,
  });

  // Fetch MFA devices
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['mfa-devices'],
    queryFn: () => accessControlService.getMFADevices(),
  });

  // Update MFA settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: accessControlService.updateMFASettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-settings'] });
    },
  });

  // Disable MFA device mutation
  const disableDeviceMutation = useMutation({
    mutationFn: accessControlService.disableMFADevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-devices'] });
    },
  });

  const handleDisableDevice = (deviceId: string) => {
    if (window.confirm('Are you sure you want to disable this MFA device?')) {
      disableDeviceMutation.mutate(deviceId);
    }
  };

  const handleSetupSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['mfa-devices'] });
  };

  const getMethodIcon = (method: MFAMethod) => {
    switch (method) {
      case MFAMethod.TOTP:
        return <SmartphoneIcon />;
      case MFAMethod.SMS:
        return <PhoneIcon />;
      case MFAMethod.EMAIL:
        return <EmailIcon />;
      case MFAMethod.HARDWARE_TOKEN:
        return <KeyIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  const getMethodLabel = (method: MFAMethod) => {
    switch (method) {
      case MFAMethod.TOTP:
        return 'Authenticator App';
      case MFAMethod.SMS:
        return 'SMS';
      case MFAMethod.EMAIL:
        return 'Email';
      case MFAMethod.HARDWARE_TOKEN:
        return 'Hardware Token';
      case MFAMethod.BIOMETRIC:
        return 'Biometric';
      case MFAMethod.BACKUP_CODES:
        return 'Backup Codes';
      default:
        return method;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'username',
      headerName: 'User',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'deviceName',
      headerName: 'Device Name',
      width: 200,
    },
    {
      field: 'method',
      headerName: 'Method',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getMethodIcon(params.value)}
          <Typography variant="body2">{getMethodLabel(params.value)}</Typography>
        </Box>
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
      field: 'isVerified',
      headerName: 'Verified',
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value ? 'Verified' : 'Pending'}
          color={params.value ? 'success' : 'warning'}
          icon={params.value ? <CheckCircleIcon /> : <WarningIcon />}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      renderCell: (params) => format(new Date(params.value), 'MMM dd, yyyy'),
    },
    {
      field: 'lastUsedAt',
      headerName: 'Last Used',
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
          key="disable"
          icon={<DeleteIcon />}
          label="Disable"
          onClick={() => handleDisableDevice(params.row.id)}
          disabled={!hasPermission(Permission.MANAGE_USERS)}
        />,
      ],
    },
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
      <GridToolbarExport />
      <Box sx={{ flexGrow: 1 }} />
      <Button
        startIcon={<AddIcon />}
        onClick={() => setSetupDialogOpen(true)}
        disabled={!hasPermission(Permission.MANAGE_USERS)}
      >
        Setup MFA
      </Button>
    </GridToolbarContainer>
  );

  if (settingsLoading || devicesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Multi-Factor Authentication Management
      </Typography>

      <Grid container spacing={3}>
        {/* MFA Settings Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">MFA Settings</Typography>
              </Box>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mfaSettings?.enabled || false}
                      onChange={(e) =>
                        updateSettingsMutation.mutate({ enabled: e.target.checked })
                      }
                      disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG)}
                    />
                  }
                  label="Enable MFA"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={mfaSettings?.requiredForAllUsers || false}
                      onChange={(e) =>
                        updateSettingsMutation.mutate({ requiredForAllUsers: e.target.checked })
                      }
                      disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG) || !mfaSettings?.enabled}
                    />
                  }
                  label="Required for All Users"
                />

                <Divider />

                <Typography variant="subtitle2">Available Methods:</Typography>
                <List dense>
                  {mfaSettings?.methods?.map((method) => (
                    <ListItem key={method}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {getMethodIcon(method)}
                      </ListItemIcon>
                      <ListItemText primary={getMethodLabel(method)} />
                    </ListItem>
                  ))}
                </List>

                <Button
                  startIcon={<SettingsIcon />}
                  onClick={() => setSettingsDialogOpen(true)}
                  disabled={!hasPermission(Permission.MANAGE_SYSTEM_CONFIG)}
                  size="small"
                >
                  Configure Methods
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* MFA Statistics */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                MFA Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {devicesData?.devices?.filter(d => d.isActive).length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Devices
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {devicesData?.devices?.filter(d => d.isVerified).length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verified Devices
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {devicesData?.devices?.filter(d => !d.isVerified).length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Verification
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="text.primary">
                      {new Set(devicesData?.devices?.map(d => d.userId)).size || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Users with MFA
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* MFA Devices Table */}
        <Grid item xs={12}>
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={devicesData?.devices || []}
              columns={columns}
              slots={{
                toolbar: CustomToolbar,
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
          </Paper>
        </Grid>
      </Grid>

      {/* MFA Setup Dialog */}
      <MFASetupDialog
        open={setupDialogOpen}
        onClose={() => setSetupDialogOpen(false)}
        userId={selectedUserId}
        onSuccess={handleSetupSuccess}
      />
    </Box>
  );
};

export default MFAManagementPanel;