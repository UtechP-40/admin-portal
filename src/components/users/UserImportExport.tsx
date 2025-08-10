import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementApi } from '../../services/userManagementApi';

interface UserImportExportProps {
  open: boolean;
  onClose: () => void;
  selectedUsers?: string[];
  roleTemplates: any[];
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
      id={`import-export-tabpanel-${index}`}
      aria-labelledby={`import-export-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ImportPreviewUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  permissions: string[];
  status: 'valid' | 'warning' | 'error';
  issues: string[];
}

const UserImportExport: React.FC<UserImportExportProps> = ({
  open,
  onClose,
  selectedUsers = [],
  roleTemplates
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [importData, setImportData] = useState('');
  const [exportFormat, setExportFormat] = useState('json');
  const [exportOptions, setExportOptions] = useState({
    includePermissions: true,
    includeMetadata: true,
    includePasswords: false
  });
  const [importPreview, setImportPreview] = useState<ImportPreviewUser[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Import users mutation
  const importUsersMutation = useMutation({
    mutationFn: (users: any[]) => userManagementApi.bulkImportUsers(users),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      setImportData('');
      setImportPreview([]);
      setShowPreview(false);
    }
  });

  // Export users mutation
  const exportUsersMutation = useMutation({
    mutationFn: ({ userIds, format, options }: { 
      userIds: string[]; 
      format: string; 
      options: any 
    }) => userManagementApi.exportUsers(userIds, format, options),
    onSuccess: (data, variables) => {
      // Create download link
      const mimeType = variables.format === 'json' ? 'application/json' : 'text/csv';
      const blob = new Blob([data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.${variables.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
        validateImportData(content);
      };
      reader.readAsText(file);
    }
  };

  const validateImportData = (data: string) => {
    try {
      const users = JSON.parse(data);
      if (!Array.isArray(users)) {
        throw new Error('Data must be an array of users');
      }

      const preview: ImportPreviewUser[] = users.map((user, index) => {
        const issues: string[] = [];
        let status: 'valid' | 'warning' | 'error' = 'valid';

        // Required field validation
        if (!user.username) {
          issues.push('Username is required');
          status = 'error';
        }
        if (!user.email) {
          issues.push('Email is required');
          status = 'error';
        }
        if (!user.firstName) {
          issues.push('First name is required');
          status = 'error';
        }
        if (!user.lastName) {
          issues.push('Last name is required');
          status = 'error';
        }

        // Email format validation
        if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
          issues.push('Invalid email format');
          status = 'error';
        }

        // Username validation
        if (user.username && user.username.length < 3) {
          issues.push('Username must be at least 3 characters');
          status = 'error';
        }

        // Permissions validation
        if (!user.permissions || !Array.isArray(user.permissions)) {
          issues.push('Permissions must be an array');
          if (status !== 'error') status = 'warning';
        } else if (user.permissions.length === 0) {
          issues.push('At least one permission is required');
          if (status !== 'error') status = 'warning';
        }

        // Password validation (if provided)
        if (user.password && user.password.length < 8) {
          issues.push('Password must be at least 8 characters');
          if (status !== 'error') status = 'warning';
        }

        return {
          username: user.username || `User ${index + 1}`,
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          permissions: user.permissions || [],
          status,
          issues
        };
      });

      setImportPreview(preview);
      setShowPreview(true);
    } catch (error) {
      setImportPreview([]);
      setShowPreview(false);
    }
  };

  const handleImportUsers = () => {
    try {
      const users = JSON.parse(importData);
      const validUsers = users.filter((user: any, index: number) => 
        importPreview[index]?.status !== 'error'
      );
      
      if (validUsers.length > 0) {
        importUsersMutation.mutate(validUsers);
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleExportUsers = () => {
    if (selectedUsers.length > 0) {
      exportUsersMutation.mutate({
        userIds: selectedUsers,
        format: exportFormat,
        options: exportOptions
      });
    }
  };

  const removePreviewUser = (index: number) => {
    const newPreview = [...importPreview];
    newPreview.splice(index, 1);
    setImportPreview(newPreview);
    
    // Update import data
    try {
      const users = JSON.parse(importData);
      users.splice(index, 1);
      setImportData(JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Failed to update import data:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const validUsers = importPreview.filter(user => user.status !== 'error').length;
  const warningUsers = importPreview.filter(user => user.status === 'warning').length;
  const errorUsers = importPreview.filter(user => user.status === 'error').length;

  const sampleImportData = {
    json: `[
  {
    "username": "john.doe",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "permissions": ["user_management", "analytics_view"],
    "password": "temporaryPassword123"
  },
  {
    "username": "jane.smith",
    "email": "jane.smith@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "permissions": ["system_configuration", "database_management"]
  }
]`,
    csv: `username,email,firstName,lastName,permissions,password
john.doe,john.doe@example.com,John,Doe,"user_management,analytics_view",temporaryPassword123
jane.smith,jane.smith@example.com,Jane,Smith,"system_configuration,database_management",`
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        User Import & Export
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Import Users" icon={<UploadIcon />} iconPosition="start" />
            <Tab label="Export Users" icon={<DownloadIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Import Users from JSON
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Import users by uploading a JSON file or pasting JSON data. Each user should include: 
            username, email, firstName, lastName, and permissions array.
          </Alert>

          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileUpload}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload File
            </Button>
            <Button
              variant="outlined"
              onClick={() => setImportData(sampleImportData.json)}
            >
              Load Sample Data
            </Button>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={12}
            label="JSON Data"
            value={importData}
            onChange={(e) => {
              setImportData(e.target.value);
              if (e.target.value.trim()) {
                validateImportData(e.target.value);
              } else {
                setShowPreview(false);
                setImportPreview([]);
              }
            }}
            placeholder={sampleImportData.json}
            sx={{ mb: 2 }}
          />

          {/* Import Preview */}
          {showPreview && importPreview.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Import Preview ({importPreview.length} users)
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip 
                  label={`${validUsers} Valid`} 
                  color="success" 
                  size="small" 
                />
                {warningUsers > 0 && (
                  <Chip 
                    label={`${warningUsers} Warnings`} 
                    color="warning" 
                    size="small" 
                  />
                )}
                {errorUsers > 0 && (
                  <Chip 
                    label={`${errorUsers} Errors`} 
                    color="error" 
                    size="small" 
                  />
                )}
              </Box>

              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell>Issues</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importPreview.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {getStatusIcon(user.status)}
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {user.permissions.slice(0, 2).map((perm) => (
                              <Chip key={perm} label={perm} size="small" />
                            ))}
                            {user.permissions.length > 2 && (
                              <Chip 
                                label={`+${user.permissions.length - 2}`} 
                                size="small" 
                                variant="outlined" 
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {user.issues.length > 0 && (
                            <Tooltip title={user.issues.join(', ')}>
                              <Chip 
                                label={`${user.issues.length} issue(s)`}
                                color={user.status === 'error' ? 'error' : 'warning'}
                                size="small"
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => removePreviewUser(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {errorUsers > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {errorUsers} user(s) have errors and will be skipped during import. 
                  Only {validUsers} valid user(s) will be imported.
                </Alert>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setImportData('');
                setImportPreview([]);
                setShowPreview(false);
              }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              onClick={handleImportUsers}
              disabled={!showPreview || validUsers === 0 || importUsersMutation.isPending}
              startIcon={<UploadIcon />}
            >
              {importUsersMutation.isPending ? 'Importing...' : `Import ${validUsers} Users`}
            </Button>
          </Box>

          {importUsersMutation.isSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Users imported successfully!
            </Alert>
          )}

          {importUsersMutation.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Import failed: {importUsersMutation.error.message}
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Export Selected Users ({selectedUsers.length})
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            Export the selected users to a file. Choose the format and options below.
          </Alert>

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle2" gutterBottom>
              Export Options
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <label>
                <input
                  type="checkbox"
                  checked={exportOptions.includePermissions}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includePermissions: e.target.checked
                  })}
                />
                Include permissions
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetadata}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includeMetadata: e.target.checked
                  })}
                />
                Include metadata (creation date, last login, etc.)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={exportOptions.includePasswords}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includePasswords: e.target.checked
                  })}
                />
                Include password hashes (security risk)
              </label>
            </Box>
          </Box>

          {exportOptions.includePasswords && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Including password hashes in exports is a security risk. Only enable this if absolutely necessary.
            </Alert>
          )}

          <Button
            variant="contained"
            onClick={handleExportUsers}
            disabled={selectedUsers.length === 0 || exportUsersMutation.isPending}
            startIcon={<DownloadIcon />}
            fullWidth
          >
            {exportUsersMutation.isPending ? 'Exporting...' : `Export ${selectedUsers.length} Users`}
          </Button>

          {exportUsersMutation.isSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Export completed! The file should start downloading automatically.
            </Alert>
          )}

          {exportUsersMutation.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Export failed: {exportUsersMutation.error.message}
            </Alert>
          )}
        </TabPanel>

        {(importUsersMutation.isPending || exportUsersMutation.isPending) && (
          <LinearProgress sx={{ mt: 2 }} />
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserImportExport;