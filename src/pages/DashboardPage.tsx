import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Paper } from '@mui/material';
import { TrendingUp, People, Games, Speed } from '@mui/icons-material';
import { motion } from 'framer-motion';

const DashboardPage: React.FC = () => {
  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12%',
      icon: <People fontSize="large" />,
      color: '#1976d2',
    },
    {
      title: 'Active Games',
      value: '56',
      change: '+8%',
      icon: <Games fontSize="large" />,
      color: '#2e7d32',
    },
    {
      title: 'Server Performance',
      value: '98.5%',
      change: '+0.2%',
      icon: <Speed fontSize="large" />,
      color: '#ed6c02',
    },
    {
      title: 'Growth Rate',
      value: '15.3%',
      change: '+3.1%',
      icon: <TrendingUp fontSize="large" />,
      color: '#9c27b0',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Welcome to the Mobile Mafia Game Admin Portal
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography
                        color="text.secondary"
                        gutterBottom
                        variant="body2"
                      >
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" component="div">
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'success.main' }}
                      >
                        {stat.change} from last month
                      </Typography>
                    </Box>
                    <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Activity charts and logs will be displayed here
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              System health indicators will be displayed here
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
