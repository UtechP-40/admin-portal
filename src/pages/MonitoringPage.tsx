import React from 'react';
import { Typography, Box, Paper } from '@mui/material';

const MonitoringPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Monitoring
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Monitor system health and performance
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Health
        </Typography>
        <Typography variant="body2" color="text.secondary">
          System monitoring dashboard will be implemented here
        </Typography>
      </Paper>
    </Box>
  );
};

export default MonitoringPage;
