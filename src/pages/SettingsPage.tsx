import React from 'react';
import { Typography, Box, Paper } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Configure system and user settings
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Settings interface will be implemented here
        </Typography>
      </Paper>
    </Box>
  );
};

export default SettingsPage;
