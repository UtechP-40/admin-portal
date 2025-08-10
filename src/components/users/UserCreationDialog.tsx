import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { Send as SendIcon, Person as PersonIcon, Security as SecurityIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementApi } from '../../services/userManagementApi';

interface UserCreationDialogProps {
  open: boolean;
  onClose: () => void;
  roleTemplates: any[];
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  permissions: string[];
  sendEmailVerification: boolean;
  requirePasswordChange: boolean;
}

const UserCreationDialog: React.FC<UserCreationDialogProps> = ({
  open,
  onClose,
  roleTemplates
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    permissions: [],
    sendEmailVerification: true,
    requirePasswordChange: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const result = await userManagementApi.createAdminUser({
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        permissions: data.permissions
      });

      // Send email verification if requested
      if (data.sendEmailVerification) {
        await userManagementApi.sendEmailVerification(result.id);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      handleClose();
    }
  });

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.username.trim()) newErrors.username = 'Username is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.password.trim()) newErrors.password = 'Password is required';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        break;
      case 1: // Permissions
        if (formData.permissions.length === 0) {
          newErrors.permissions = 'At least one permission is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (validateStep(activeStep)) {
      createUserMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      permissions: [],
      sendEmailVerification: true,
      requirePasswordChange: true
    });
    setErrors({});
    onClose();
  };

  const handleRoleTemplateSelect = (templateId: string) => {
    const template = roleTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData({ ...formData, permissions: [...template.permissions] });
    }
  };

  const addPermission = (permission: string) => {
    if (!formData.permissions.includes(permission)) {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permission]
      });
    }
  };

  const removePermission = (permission: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.filter(p => p !== permission)
    });
  };

  const availablePermissions = [
    'user_management',
    'system_configuration',
    'analytics_view',
    'database_management',
    'api_testing',
    'game_monitoring',
    'security_management',
    'audit_logs'
  ];

  const steps = [
    {
      label: 'Basic Information',
      icon: <PersonIcon />
    },
    {
      label: 'Permissions & Role',
      icon: <SecurityIcon />
    },
    {
      label: 'Email & Security',
      icon: <SendIcon />
    }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Admin User</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Basic Information */}
          <Step>
            <StepLabel icon={steps[0].icon}>
              {steps[0].label}
            </StepLabel>
            <StepContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    error={!!errors.username}
                    helperText={errors.username}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={!!errors.email}
                    helperText={errors.email}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Temporary Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={!!errors.password}
                    helperText={errors.password || 'User will be required to change password on first login'}
                    required
                  />
                </Grid>
              </Grid>
              <Box sx={{ mb: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Continue
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: Permissions & Role */}
          <Step>
            <StepLabel icon={steps[1].icon}>
              {steps[1].label}
            </StepLabel>
            <StepContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Apply Role Template (Optional)</InputLabel>
                    <Select
                      value=""
                      onChange={(e) => handleRoleTemplateSelect(e.target.value)}
                    >
                      {roleTemplates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name} - {template.description}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Available Permissions
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {availablePermissions.map((permission) => (
                      <Chip
                        key={permission}
                        label={permission.replace('_', ' ').toUpperCase()}
                        onClick={() => addPermission(permission)}
                        color={formData.permissions.includes(permission) ? 'primary' : 'default'}
                        variant={formData.permissions.includes(permission) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Permissions ({formData.permissions.length})
                  </Typography>
                  {errors.permissions && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errors.permissions}
                    </Alert>
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.permissions.map((permission) => (
                      <Chip
                        key={permission}
                        label={permission.replace('_', ' ').toUpperCase()}
                        onDelete={() => removePermission(permission)}
                        color="primary"
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ mb: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Continue
                </Button>
                <Button
                  onClick={handleBack}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Email & Security */}
          <Step>
            <StepLabel icon={steps[2].icon}>
              {steps[2].label}
            </StepLabel>
            <StepContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.sendEmailVerification}
                        onChange={(e) => setFormData({ ...formData, sendEmailVerification: e.target.checked })}
                      />
                    }
                    label="Send email verification to user"
                  />
                  <Typography variant="body2" color="textSecondary">
                    User will receive an email with account details and verification link
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.requirePasswordChange}
                        onChange={(e) => setFormData({ ...formData, requirePasswordChange: e.target.checked })}
                      />
                    }
                    label="Require password change on first login"
                  />
                  <Typography variant="body2" color="textSecondary">
                    User must change their password when they first log in
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Summary:</strong><br />
                      • Username: {formData.username}<br />
                      • Email: {formData.email}<br />
                      • Name: {formData.firstName} {formData.lastName}<br />
                      • Permissions: {formData.permissions.length} selected<br />
                      • Email verification: {formData.sendEmailVerification ? 'Yes' : 'No'}<br />
                      • Password change required: {formData.requirePasswordChange ? 'Yes' : 'No'}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
              <Box sx={{ mb: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={createUserMutation.isPending}
                  sx={{ mt: 1, mr: 1 }}
                >
                  {createUserMutation.isPending ? 'Creating User...' : 'Create User'}
                </Button>
                <Button
                  onClick={handleBack}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>

        {createUserMutation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {createUserMutation.error.message || 'Failed to create user'}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserCreationDialog;