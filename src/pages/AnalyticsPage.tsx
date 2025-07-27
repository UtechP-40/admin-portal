import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import {
  DashboardOverview,
  UserAnalytics,
  GameAnalytics,
  SystemPerformance,
  LoggingDashboard,
  CustomDashboard,
  AlertsAndReports
} from '../components/analytics';
import { analyticsService } from '../services/analytics';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: startOfDay(subDays(new Date(), 7)),
    endDate: endOfDay(new Date())
  });
  const [quickRange, setQuickRange] = useState('7d');

  // Fetch dashboard metrics for overview
  const { data: dashboardMetrics, isLoading, error } = useQuery({
    queryKey: ['dashboardMetrics', dateRange.startDate, dateRange.endDate],
    queryFn: () => analyticsService.getDashboardMetrics({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      granularity: 'day'
    }),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleQuickRangeChange = (range: string) => {
    setQuickRange(range);
    const now = new Date();
    
    switch (range) {
      case '1d':
        setDateRange({
          startDate: startOfDay(subDays(now, 1)),
          endDate: endOfDay(now)
        });
        break;
      case '7d':
        setDateRange({
          startDate: startOfDay(subDays(now, 7)),
          endDate: endOfDay(now)
        });
        break;
      case '30d':
        setDateRange({
          startDate: startOfDay(subDays(now, 30)),
          endDate: endOfDay(now)
        });
        break;
      case '90d':
        setDateRange({
          startDate: startOfDay(subDays(now, 90)),
          endDate: endOfDay(now)
        });
        break;
      default:
        break;
    }
  };

  const tabs = [
    { label: 'Overview', icon: '📊' },
    { label: 'Users', icon: '👥' },
    { label: 'Games', icon: '🎮' },
    { label: 'System', icon: '⚙️' },
    { label: 'Logs', icon: '📝' },
    { label: 'Custom', icon: '🔧' },
    { label: 'Alerts', icon: '🚨' }
  ];

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Analytics
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load analytics data. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Analytics Dashboard
          </Typography>
          
          {/* Date Range Controls */}
          <Box display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Quick Range</InputLabel>
              <Select
                value={quickRange}
                label="Quick Range"
                onChange={(e) => handleQuickRangeChange(e.target.value)}
              >
                <MenuItem value="1d">Last 24 hours</MenuItem>
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
              </Select>
            </FormControl>
            
            <DatePicker
              label="Start Date"
              value={dateRange.startDate}
              onChange={(date) => date && setDateRange({ ...dateRange, startDate: startOfDay(date) })}
              slotProps={{ textField: { size: 'small' } }}
            />
            
            <DatePicker
              label="End Date"
              value={dateRange.endDate}
              onChange={(date) => date && setDateRange({ ...dateRange, endDate: endOfDay(date) })}
              slotProps={{ textField: { size: 'small' } }}
            />
          </Box>
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="analytics tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{tab.icon}</span>
                      {tab.label}
                    </Box>
                  }
                  id={`analytics-tab-${index}`}
                  aria-controls={`analytics-tabpanel-${index}`}
                />
              ))}
            </Tabs>
          </Box>

          {/* Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            {isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
              </Box>
            ) : dashboardMetrics ? (
              <DashboardOverview metrics={dashboardMetrics} loading={isLoading} />
            ) : (
              <Alert severity="info">No data available for the selected date range.</Alert>
            )}
          </TabPanel>

          {/* User Analytics Tab */}
          <TabPanel value={activeTab} index={1}>
            <UserAnalytics
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </TabPanel>

          {/* Game Analytics Tab */}
          <TabPanel value={activeTab} index={2}>
            <GameAnalytics
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </TabPanel>

          {/* System Performance Tab */}
          <TabPanel value={activeTab} index={3}>
            <SystemPerformance
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </TabPanel>

          {/* Logging Dashboard Tab */}
          <TabPanel value={activeTab} index={4}>
            <LoggingDashboard
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </TabPanel>

          {/* Custom Dashboard Tab */}
          <TabPanel value={activeTab} index={5}>
            <CustomDashboard />
          </TabPanel>

          {/* Alerts and Reports Tab */}
          <TabPanel value={activeTab} index={6}>
            <AlertsAndReports />
          </TabPanel>
        </Paper>

        {/* Analytics Health Status */}
        {dashboardMetrics && (
          <Box mt={3}>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {new Date(dashboardMetrics.generatedAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant="body2" color="text.secondary">
                    Data range: {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant="body2" color="text.secondary">
                    Total events: {dashboardMetrics.overview.totalEvents.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default AnalyticsPage;
