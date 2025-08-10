import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface SessionTimeoutDialogProps {
  open: boolean;
  onExtendSession: () => void;
  onLogout: () => void;
  remainingTime: number;
}

const SessionTimeoutDialog: React.FC<SessionTimeoutDialogProps> = ({
  open,
  onExtendSession,
  onLogout,
  remainingTime,
}) => {
  const [timeLeft, setTimeLeft] = useState(remainingTime);

  useEffect(() => {
    if (!open) return;

    setTimeLeft(remainingTime);
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, remainingTime, onLogout]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressValue = ((remainingTime - timeLeft) / remainingTime) * 100;

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: (theme) => theme.shadows[10],
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <WarningIcon color="warning" />
        Session Timeout Warning
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            Your session will expire soon due to inactivity. You will be automatically 
            logged out in:
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {formatTime(timeLeft)}
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={progressValue}
            color="warning"
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Click "Stay Logged In" to extend your session, or "Logout" to end your session now.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onLogout}
          variant="outlined"
          color="inherit"
        >
          Logout
        </Button>
        <Button
          onClick={onExtendSession}
          variant="contained"
          color="primary"
          autoFocus
        >
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionTimeoutDialog;