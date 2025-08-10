import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth';
import SessionTimeoutDialog from './SessionTimeoutDialog';
import { Alert, Snackbar } from '@mui/material';

const SessionManager: React.FC = () => {
  const { logout, isAuthenticated } = useAuth();
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showForbiddenAlert, setShowForbiddenAlert] = useState(false);
  const [forbiddenMessage, setForbiddenMessage] = useState('');
  const [showServerErrorAlert, setShowServerErrorAlert] = useState(false);
  const [serverErrorMessage, setServerErrorMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    // Session warning handler
    const handleSessionWarning = (event: CustomEvent) => {
      setRemainingTime(event.detail.remainingTime);
      setShowTimeoutDialog(true);
    };

    // Session expired handler
    const handleSessionExpired = () => {
      setShowTimeoutDialog(false);
      // Logout will be handled by the event itself
    };

    // Logout handler
    const handleLogout = () => {
      setShowTimeoutDialog(false);
    };

    // Forbidden access handler
    const handleForbidden = (event: CustomEvent) => {
      setForbiddenMessage(event.detail.message || 'Access forbidden');
      setShowForbiddenAlert(true);
    };

    // Server error handler
    const handleServerError = (event: CustomEvent) => {
      setServerErrorMessage(
        event.detail.message || `Server error (${event.detail.status})`
      );
      setShowServerErrorAlert(true);
    };

    // Activity handlers to extend session
    const handleUserActivity = () => {
      if (isAuthenticated) {
        authService.extendSession();
      }
    };

    // Add event listeners
    window.addEventListener('auth:session-warning', handleSessionWarning as EventListener);
    window.addEventListener('auth:session-expired', handleSessionExpired);
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:forbidden', handleForbidden as EventListener);
    window.addEventListener('api:server-error', handleServerError as EventListener);

    // Add activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      // Remove event listeners
      window.removeEventListener('auth:session-warning', handleSessionWarning as EventListener);
      window.removeEventListener('auth:session-expired', handleSessionExpired);
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:forbidden', handleForbidden as EventListener);
      window.removeEventListener('api:server-error', handleServerError as EventListener);

      // Remove activity listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated]);

  const handleExtendSession = () => {
    authService.extendSession();
    setShowTimeoutDialog(false);
  };

  const handleLogoutFromDialog = async () => {
    setShowTimeoutDialog(false);
    await logout();
  };

  const handleCloseForbiddenAlert = () => {
    setShowForbiddenAlert(false);
  };

  const handleCloseServerErrorAlert = () => {
    setShowServerErrorAlert(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <SessionTimeoutDialog
        open={showTimeoutDialog}
        onExtendSession={handleExtendSession}
        onLogout={handleLogoutFromDialog}
        remainingTime={remainingTime}
      />

      <Snackbar
        open={showForbiddenAlert}
        autoHideDuration={6000}
        onClose={handleCloseForbiddenAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseForbiddenAlert}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {forbiddenMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={showServerErrorAlert}
        autoHideDuration={8000}
        onClose={handleCloseServerErrorAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseServerErrorAlert}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {serverErrorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SessionManager;