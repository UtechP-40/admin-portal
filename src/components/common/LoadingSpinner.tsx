import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  Paper,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
  overlay?: boolean;
  variant?: 'circular' | 'linear' | 'skeleton';
  height?: number;
  width?: number | string;
  lines?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 40,
  fullScreen = false,
  overlay = false,
  variant = 'circular',
  height = 20,
  width = '100%',
  lines = 3,
}) => {
  // Skeleton loading variant
  if (variant === 'skeleton') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Box sx={{ width }}>
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              width={width}
              height={height}
              sx={{ mb: 1, borderRadius: 1 }}
            />
          ))}
        </Box>
      </motion.div>
    );
  }

  // Linear progress variant
  if (variant === 'linear') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Box sx={{ width, mb: message ? 2 : 0 }}>
          <LinearProgress />
          {message && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              {message}
            </Typography>
          )}
        </Box>
      </motion.div>
    );
  }

  // Circular progress variant (default)
  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 3,
        }}
      >
        <CircularProgress size={size} />
        {message && (
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        )}
      </Box>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
        open={true}
      >
        <Paper
          elevation={3}
          sx={{
            borderRadius: 2,
            backgroundColor: 'background.paper',
            color: 'text.primary',
          }}
        >
          {content}
        </Paper>
      </Backdrop>
    );
  }

  if (overlay) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: (theme) => 
            theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)',
          zIndex: 1,
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default LoadingSpinner;