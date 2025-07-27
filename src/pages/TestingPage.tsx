import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import { ApiTesting } from '../components/testing/ApiTesting';
import { SocketTesting } from '../components/testing/SocketTesting';
import { GameRoomMonitoring } from '../components/testing/GameRoomMonitoring';
import { MobileSimulator } from '../components/testing/MobileSimulator';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`testing-tabpanel-${index}`}
      aria-labelledby={`testing-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `testing-tab-${index}`,
    'aria-controls': `testing-tabpanel-${index}`,
  };
}

export function TestingPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Testing & Development Interface
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Comprehensive testing tools for API endpoints, Socket.io connections, game room management, and mobile UI simulation
        </Typography>

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="testing interface tabs"
              variant="fullWidth"
            >
              <Tab label="API Testing" {...a11yProps(0)} />
              <Tab label="Socket Testing" {...a11yProps(1)} />
              <Tab label="Game Room Monitoring" {...a11yProps(2)} />
              <Tab label="Mobile Simulator" {...a11yProps(3)} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <ApiTesting />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <SocketTesting />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <GameRoomMonitoring />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <MobileSimulator />
          </TabPanel>
        </Paper>
      </motion.div>
    </Container>
  );
}

export default TestingPage;