import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  Card,
  CardContent,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion } from 'framer-motion';
import { Email, CheckCircle, Lock } from '@mui/icons-material';
import { passwordResetRequestSchema, passwordResetSchema } from '../utils/validators';
import type { PasswordResetRequestData, PasswordResetData } from '../utils/validators';
import { useAuth } from '../hooks/useAuth';

const PasswordResetPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { requestPasswordReset, resetPassword, isRequestingPasswordReset, isResettingPassword, passwordResetRequestError, passwordResetError } = useAuth();
  
  const [step, setStep] = useState<'request' | 'sent' | 'reset' | 'success'>(
    token ? 'reset' : 'request'
  );

  // Password reset request form
  const requestForm = useForm<PasswordResetRequestData>({
    resolver: yupResolver(passwordResetRequestSchema),
    defaultValues: { email: '' },
  });

  // Password reset form
  const resetForm = useForm<PasswordResetData>({
    resolver: yupResolver(passwordResetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onRequestSubmit = async (data: PasswordResetRequestData) => {
    try {
      await requestPasswordReset(data.email);
      setStep('sent');
    } catch (error) {
      console.error('Password reset request failed:', error);
    }
  };

  const onResetSubmit = async (data: PasswordResetData) => {
    if (!token) return;
    
    try {
      await resetPassword(token, data.password);
      setStep('success');
    } catch (error) {
      console.error('Password reset failed:', error);
    }
  };

  const renderRequestForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Lock sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography component="h1" variant="h4" gutterBottom>
          Reset Password
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>

        {passwordResetRequestError && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {passwordResetRequestError.message || 'Failed to send reset email. Please try again.'}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={requestForm.handleSubmit(onRequestSubmit)}
          sx={{ mt: 1, width: '100%' }}
        >
          <Controller
            name="email"
            control={requestForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                error={!!requestForm.formState.errors.email}
                helperText={requestForm.formState.errors.email?.message}
              />
            )}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isRequestingPasswordReset}
          >
            {isRequestingPasswordReset ? <CircularProgress size={24} /> : 'Send Reset Link'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Back to Login
            </Link>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );

  const renderSentConfirmation = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Email sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography component="h1" variant="h4" gutterBottom>
          Check Your Email
        </Typography>
        <Card sx={{ width: '100%', mb: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              We've sent a password reset link to your email address.
              Please check your inbox and follow the instructions.
            </Typography>
          </CardContent>
        </Card>
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => setStep('request')}
            sx={{ mr: 1 }}
          >
            Resend Email
          </Button>
          <Link component={RouterLink} to="/login" variant="body2">
            Back to Login
          </Link>
        </Box>
      </Paper>
    </motion.div>
  );

  const renderResetForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Lock sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography component="h1" variant="h4" gutterBottom>
          Set New Password
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
          Enter your new password below.
        </Typography>

        {passwordResetError && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {passwordResetError.message || 'Failed to reset password. Please try again.'}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={resetForm.handleSubmit(onResetSubmit)}
          sx={{ mt: 1, width: '100%' }}
        >
          <Controller
            name="password"
            control={resetForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoComplete="new-password"
                autoFocus
                error={!!resetForm.formState.errors.password}
                helperText={resetForm.formState.errors.password?.message}
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={resetForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                error={!!resetForm.formState.errors.confirmPassword}
                helperText={resetForm.formState.errors.confirmPassword?.message}
              />
            )}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isResettingPassword}
          >
            {isResettingPassword ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Back to Login
            </Link>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );

  const renderSuccess = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
        <Typography component="h1" variant="h4" gutterBottom>
          Password Reset
        </Typography>
        <Card sx={{ width: '100%', mb: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Your password has been successfully reset.
              You can now sign in with your new password.
            </Typography>
          </CardContent>
        </Card>
        <Button
          variant="contained"
          fullWidth
          onClick={() => navigate('/login')}
        >
          Go to Login
        </Button>
      </Paper>
    </motion.div>
  );

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {step === 'request' && renderRequestForm()}
        {step === 'sent' && renderSentConfirmation()}
        {step === 'reset' && renderResetForm()}
        {step === 'success' && renderSuccess()}
      </Box>
    </Container>
  );
};

export default PasswordResetPage;