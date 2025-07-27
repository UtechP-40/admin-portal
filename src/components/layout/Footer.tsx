import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center">
        © {new Date().getFullYear()} Mobile Mafia Game Admin Portal. Built with{' '}
        <Link color="inherit" href="https://mui.com/">
          Material-UI
        </Link>{' '}
        and{' '}
        <Link color="inherit" href="https://vitejs.dev/">
          Vite
        </Link>
        .
      </Typography>
    </Box>
  );
};

export default Footer;
