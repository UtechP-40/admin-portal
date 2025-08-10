import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userManagementApi } from '../../services/userManagementApi';

interface EmailVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  username: string;
}

interface EmailVerificationStatus {
  isVerified: boolean;
  verificationSentAt?: string;
  verificationExpiresAt?: string;
  verificationAttempts: number;
  lastVerificationAttempt?: string;
}

const EmailVerificationDialog: React.FC<EmailVerificationDialogProps> = ({
  open,
  onClose,
  userId,
  userEmail,
  username
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [includeLoginInstructions, setIncludeLoginInstructions] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  const queryClient = useQueryClient();

  // Fetch email verification status
  const { data: verificationStatus, isLoading } = useQuery({
    queryKey: ['emailVerificationStatus', userId],
    queryFn: () => userManagementApi.getEmailVerificationStatus(userId),
    enabled: open
  });

  // Send email verification mutation
  const sendVerificationMutation = useMutation({
    mutationFn: () => userManagementApi.sendEmailVerification(userId, {
      customMessage,
      includeLoginInstructions,
      sendWelcomeEmail
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailVerificationStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }
  });

  // Resend verification mutation
  const resendVerificationMutation = useMutation({
    mutationFn: () => userManagementApi.resendEmailVerification(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailVerificationStatus', userId] });
    }
  });

  // Mark as verified mutation (manual verification)
  const markAsVerifiedMutation = useMutation({
    mutationFn: () => userManagementApi.markEmailAsVerified(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailVerificationStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }
  });

  const handleSendVerification = () => {
    sendVerificationMutation.mutate();
  };

  const handleResendVerification = () => {
    resendVerificationMutation.mutate();
  };

  const handleMarkAsVerified = () => {
    if (window.confirm('Are you sure you want to manually mark this email as verified?')) {
      markAsVerifiedMutation.mutate();
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const isVerificationExpired = verificationStatus?.verificationExpiresAt && 
    new Date(verificationStatus.verificationExpiresAt) < new Date();

  const canResendVerification = !verificationStatus?.isVerified && 
    (!verificationStatus?.lastVerificationAttempt || 
     new Date().getTime() - new Date(verificationStatus.lastVerificationAttempt).getTime() > 300000); // 5 minutes

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon />
          Email Verification - {username}
        </Box>
      </DialogTitle>
      <DialogContent>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Current Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body1">
              Email: <strong>{userEmail}</strong>
            </Typography>
            <Chip
              label={verificationStatus?.isVerified ? 'Verified' : 'Not Verified'}
              color={verificationStatus?.isVerified ? 'success' : 'warning'}
              icon={verificationStatus?.isVerified ? <CheckCircleIcon /> : <WarningIcon />}
            />
          </Box>

          {verificationStatus && (
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <SendIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Verification Attempts"
                  secondary={`${verificationStatus.verificationAttempts} attempts made`}
                />
              </ListItem>
              
              {verificationStatus.verificationSentAt && (
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Verification Sent"
                    secondary={formatTimeAgo(verificationStatus.verificationSentAt)}
                  />
                </ListItem>
              )}

              {verificationStatus.verificationExpiresAt && (
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color={isVerificationExpired ? 'error' : 'warning'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Verification Expires"
                    secondary={
                      isVerificationExpired 
                        ? 'Expired - needs new verification'
                        : `Expires ${formatTimeAgo(verificationStatus.verificationExpiresAt)}`
                    }
                  />
                </ListItem>
              )}
            </List>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Send New Verification */}
        {!verificationStatus?.isVerified && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Send Email Verification
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Custom Message (Optional)"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message to include in the verification email..."
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeLoginInstructions}
                    onChange={(e) => setIncludeLoginInstructions(e.target.checked)}
                  />
                }
                label="Include login instructions"
              />
              <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                Add step-by-step instructions for accessing the admin portal
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={sendWelcomeEmail}
                    onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                  />
                }
                label="Send welcome email"
              />
              <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                Include welcome message and platform overview
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              The verification email will include a secure link that expires in 24 hours. 
              The user must click this link to verify their email address.
            </Alert>
          </Box>
        )}

        {/* Action Results */}
        {sendVerificationMutation.isSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Email verification sent successfully! The user should receive the email within a few minutes.
          </Alert>
        )}

        {sendVerificationMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to send verification email: {sendVerificationMutation.error.message}
          </Alert>
        )}

        {resendVerificationMutation.isSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Verification email resent successfully!
          </Alert>
        )}

        {markAsVerifiedMutation.isSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Email has been manually marked as verified.
          </Alert>
        )}

        {/* Rate Limiting Warning */}
        {!canResendVerification && !verificationStatus?.isVerified && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please wait at least 5 minutes between verification email attempts to prevent spam.
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        
        {!verificationStatus?.isVerified && (
          <>
            {verificationStatus?.verificationSentAt && canResendVerification && (
              <Button
                onClick={handleResendVerification}
                disabled={resendVerificationMutation.isPending}
                startIcon={<RefreshIcon />}
              >
                {resendVerificationMutation.isPending ? 'Resending...' : 'Resend Verification'}
              </Button>
            )}
            
            <Button
              onClick={handleSendVerification}
              variant="contained"
              disabled={sendVerificationMutation.isPending || !canResendVerification}
              startIcon={<SendIcon />}
            >
              {sendVerificationMutation.isPending ? 'Sending...' : 'Send Verification Email'}
            </Button>
            
            <Button
              onClick={handleMarkAsVerified}
              color="warning"
              disabled={markAsVerifiedMutation.isPending}
            >
              {markAsVerifiedMutation.isPending ? 'Marking...' : 'Mark as Verified'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EmailVerificationDialog;