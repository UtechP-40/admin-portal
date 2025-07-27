import React from 'react';
import { Typography, Box, Paper } from '@mui/material';

const AnalyticsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        View detailed analytics and metrics
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Analytics charts and metrics will be displayed here
        </Typography>
      </Paper>
    </Box>
  );
};

export default AnalyticsPage;
