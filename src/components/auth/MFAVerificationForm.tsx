import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Divider,
  Stack,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Security as SecurityIcon,
  PhoneAndroid as PhoneIcon,
  Email as EmailIcon,
  Smartphone as SmartphoneIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import type { MFAMethod } from '../../types/accessControl';

interface MFAVerificationFormProps {
  mfaToken: string;
  availableMethods: string[];
  onSuccess: () => void;
  onBack: () => void;
}

const MFAVerificationForm: React.FC<MFAVerificationFormProps> = ({
  mfaToken,
  availableMethods,
  onSuccess,
  onBack,
}) => {
  const { verifyMFA, resendMFACode, isVerifyingMFA, verifyMFAError, isResendingMFACode } = useAuth();
  const [mfaCode, setMfaCode] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>(availableMethods[0] || '');
  const [trustDevice, setTrustDevice] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (!mfaCode.trim()) return;

    try {
      await verifyMFA(mfaToken, mfaCode.trim(), undefined, trustDevice);
      onSuccess();
    } catch (error) {
      console.error('MFA verification failed:', error);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendMFACode(mfaToken, selectedMethod);
      setCountdown(60); // 60 second cooldown
      setMfaCode(''); // Clear the current code
    } catch (error) {
      console.error('Failed to resend MFA code:', error);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'totp':
        return <SmartphoneIcon />;
      case 'sms':
        return <PhoneIcon />;
      case 'email':
        return <EmailIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method.toLowerCase()) {
      case 'totp':
        return 'Authenticator App';
      case 'sms':
        return 'SMS';
      case 'email':
        return 'Email';
      default:
        return method.toUpperCase();
    }
  };

  const getMethodDescription = (method: string) => {
    switch (method.toLowerCase()) {
      case 'totp':
        return 'Enter the 6-digit code from your authenticator app';
      case 'sms':
        return 'Enter the 6-digit code sent to your phone';
      case 'email':
        return 'Enter the 6-digit code sent to your email';
      default:
        return 'Enter your verification code';
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && mfaCode.trim() && !isVerifyingMFA) {
      handleVerify();
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={onBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <SecurityIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5" component="h1">
            Two-Factor Authentication
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please verify your identity using one of the available methods below.
        </Typography>

        {/* Method Selection */}
        {availableMethods.length > 1 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Verification Method
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {availableMethods.map((method) => (
                <Chip
                  key={method}
                  icon={getMethodIcon(method)}
                  label={getMethodLabel(method)}
                  onClick={() => setSelectedMethod(method)}
                  color={selectedMethod === method ? 'primary' : 'default'}
                  variant={selectedMethod === method ? 'filled' : 'outlined'}
                  clickable
                />
              ))}
            </Stack>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Current Method Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {getMethodIcon(selectedMethod)}
            <Typography variant="subtitle2" sx={{ ml: 1 }}>
              {getMethodLabel(selectedMethod)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {getMethodDescription(selectedMethod)}
          </Typography>
        </Box>

        {/* Verification Code Input */}
        <TextField
          fullWidth
          label="Verification Code"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyPress={handleKeyPress}
          placeholder="000000"
          inputProps={{
            maxLength: 6,
            style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' },
          }}
          sx={{ mb: 2 }}
          disabled={isVerifyingMFA}
          autoFocus
        />

        {/* Trust Device Option */}
        <FormControlLabel
          control={
            <Checkbox
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              disabled={isVerifyingMFA}
            />
          }
          label="Trust this device for 30 days"
          sx={{ mb: 3 }}
        />

        {/* Error Display */}
        {verifyMFAError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {verifyMFAError.message || 'Verification failed. Please try again.'}
          </Alert>
        )}

        {/* Action Buttons */}
        <Stack spacing={2}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleVerify}
            disabled={!mfaCode.trim() || mfaCode.length !== 6 || isVerifyingMFA}
            size="large"
          >
            {isVerifyingMFA ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Verify'
            )}
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Didn't receive a code?
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={handleResendCode}
              disabled={countdown > 0 || isResendingMFACode || selectedMethod === 'totp'}
              startIcon={isResendingMFACode ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </Button>
          </Box>

          {selectedMethod === 'totp' && (
            <Alert severity="info" sx={{ mt: 1 }}>
              TOTP codes are generated by your authenticator app and refresh every 30 seconds.
            </Alert>
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Having trouble? Contact your administrator for assistance.
        </Typography>
      </Paper>
    </Box>
  );
};

export default MFAVerificationForm;