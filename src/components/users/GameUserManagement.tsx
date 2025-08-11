import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Analytics as AnalyticsIcon,
  AutoMode as AutoModeIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid/models';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementApi } from '../../services/userManagementApi';
import UserBehaviorAnalytics from './UserBehaviorAnalytics';
import AutomatedModerationTools from './AutomatedModerationTools';
import GameUserAdvancedSearch from './GameUserAdvancedSearch';

interface GameUserManagementProps {
  onUserSelect?: (user: any) => void;
}

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
      id={`game-user-tabpanel-${index}`}
      aria-labelledby={`game-user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const GameUserManagement: React.FC<GameUserManagementProps> = ({ onUserSelect }) => {
  const [tabValue, setTabValue] = useState(0);
  const [searchFilters, setSearchFilters] = useState({
    basicSearch: {
      username: '',
      email: ''
    },
    activityFilters: {
      gamesPlayedMin: '',
      gamesPlayedMax: '',
      winRateMin: '',
      winRateMax: '',
      lastActiveAfter: null,
      lastActiveBefore: null
    },
    behaviorFilters: {
      riskLevel: 'all',
      suspiciousActivityScoreMin: '',
      suspiciousActivityScoreMax: '',
      flagged: false,
      banned: false
    },
    dateFilters: {
      joinedAfter: null,
      joinedBefore: null
    },
    sorting: {
      field: 'createdAt',
      direction: 'desc' as 'asc' | 'desc'
    },
    pagination: {
      page: 1,
      limit: 25
    }
  });
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch game users with filters
  const { data: gameUsers, isLoading } = useQuery({
    queryKey: ['gameUsers', searchFilters],
    queryFn: () => userManagementApi.searchGameUsers(searchFilters)
  });

  // Fetch game user statistics
  const { data: gameUserStats } = useQuery({
    queryKey: ['gameUserStatistics'],
    queryFn: () => userManagementApi.getGameUserStatistics()
  });

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: ({ id, reason, duration }: { id: string; reason: string; duration?: number }) =>
      userManagementApi.banGameUser(id, reason, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameUsers'] });
      queryClient.invalidateQueries({ queryKey: ['gameUserStatistics'] });
      setBanDialogOpen(false);
      setSelectedUser(null);
      setBanReason('');
      setBanDuration('');
    }
  });

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: (userId: string) => userManagementApi.unbanGameUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameUsers'] });
      queryClient.invalidateQueries({ queryKey: ['gameUserStatistics'] });
    }
  });

  // Flag user mutation
  const flagUserMutation = useMutation({
    mutationFn: ({ userId, reason, severity }: { userId: string; reason: string; severity: string }) =>
      userManagementApi.flagGameUser(userId, reason, severity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameUsers'] });
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBanUser = (user: any) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleUnbanUser = (userId: string) => {
    if (window.confirm('Are you sure you want to unban this user?')) {
      unbanUserMutation.mutate(userId);
    }
  };

  const handleFlagUser = (user: any) => {
    const reason = prompt('Enter flag reason:');
    const severity = prompt('Enter severity (low, medium, high):');
    if (reason && severity && ['low', 'medium', 'high'].includes(severity)) {
      flagUserMutation.mutate({ userId: user.id, reason, severity });
    }
  };

  const confirmBan = () => {
    if (selectedUser && banReason) {
      const duration = banDuration ? parseInt(banDuration) : undefined;
      banUserMutation.mutate({
        id: selectedUser.id,
        reason: banReason,
        duration
      });
    }
  };

  const handleSearchChange = (category: string, field: string, value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleBasicSearchChange = (field: string, value: string) => {
    if (field === 'status') {
      // Handle status filter for behavior filters
      setSearchFilters(prev => ({
        ...prev,
        behaviorFilters: {
          ...prev.behaviorFilters,
          banned: value === 'banned',
          flagged: value === 'flagged'
        }
      }));
    } else if (field === 'riskLevel') {
      setSearchFilters(prev => ({
        ...prev,
        behaviorFilters: {
          ...prev.behaviorFilters,
          riskLevel: value
        }
      }));
    } else {
      setSearchFilters(prev => ({
        ...prev,
        basicSearch: {
          ...prev.basicSearch,
          [field]: value
        }
      }));
    }
  };

  const clearFilters = () => {
    setSearchFilters({
      basicSearch: {
        username: '',
        email: ''
      },
      activityFilters: {
        gamesPlayedMin: '',
        gamesPlayedMax: '',
        winRateMin: '',
        winRateMax: '',
        lastActiveAfter: null,
        lastActiveBefore: null
      },
      behaviorFilters: {
        riskLevel: 'all',
        suspiciousActivityScoreMin: '',
        suspiciousActivityScoreMax: '',
        flagged: false,
        banned: false
      },
      dateFilters: {
        joinedAfter: null,
        joinedBefore: null
      },
      sorting: {
        field: 'createdAt',
        direction: 'desc'
      },
      pagination: {
        page: 1,
        limit: 25
      }
    });
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Game users columns
  const gameUserColumns: GridColDef[] = [
    { field: 'username', headerName: 'Username', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'isBanned',
      headerName: 'Banned',
      width: 100,
      renderCell: (params) => params.value ? <BlockIcon color="error" /> : <CheckCircleIcon color="success" />
    },
    {
      field: 'riskLevel',
      headerName: 'Risk Level',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || 'Unknown'}
          color={getRiskLevelColor(params.value) as any}
          size="small"
        />
      )
    },
    { field: 'gamesPlayed', headerName: 'Games', width: 100 },
    { 
      field: 'winRate', 
      headerName: 'Win Rate', 
      width: 100, 
      renderCell: (params) => `${params.value || 0}%` 
    },
    {
      field: 'suspiciousActivityScore',
      headerName: 'Suspicious Score',
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">{params.value || 0}</Typography>
          {params.value > 70 && <WarningIcon color="error" fontSize="small" />}
          {params.value > 50 && params.value <= 70 && <WarningIcon color="warning" fontSize="small" />}
        </Box>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 200,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<AnalyticsIcon />}
          label="View Analytics"
          onClick={() => onUserSelect?.(params.row)}
        />,
        <GridActionsCellItem
          icon={<FlagIcon />}
          label="Flag User"
          onClick={() => handleFlagUser(params.row)}
        />,
        <GridActionsCellItem
          icon={params.row.isBanned ? <CheckCircleIcon /> : <BlockIcon />}
          label={params.row.isBanned ? "Unban" : "Ban"}
          onClick={() => {
            if (params.row.isBanned) {
              handleUnbanUser(params.row.id);
            } else {
              handleBanUser(params.row);
            }
          }}
        />
      ]
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon />
        Game User Management
      </Typography>

      {/* Statistics Cards */}
      {gameUserStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Game Users
                </Typography>
                <Typography variant="h4">
                  {gameUserStats.totalUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Users
                </Typography>
                <Typography variant="h4">
                  {gameUserStats.activeUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Banned Users
                </Typography>
                <Typography variant="h4" color="error.main">
                  {gameUserStats.bannedUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  High Risk Users
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {gameUserStats.highRiskUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="User List" icon={<PersonIcon />} iconPosition="start" />
            <Tab label="Behavior Analytics" icon={<AnalyticsIcon />} iconPosition="start" />
            <Tab label="Automated Moderation" icon={<AutoModeIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Search and Filter Controls */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Username"
                  value={searchFilters.basicSearch.username}
                  onChange={(e) => handleBasicSearchChange('username', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Email"
                  value={searchFilters.basicSearch.email}
                  onChange={(e) => handleBasicSearchChange('email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={
                      searchFilters.behaviorFilters.banned ? 'banned' :
                      searchFilters.behaviorFilters.flagged ? 'flagged' : 'all'
                    }
                    onChange={(e) => handleBasicSearchChange('status', e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="banned">Banned</MenuItem>
                    <MenuItem value="flagged">Flagged</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Risk Level</InputLabel>
                  <Select
                    value={searchFilters.behaviorFilters.riskLevel}
                    onChange={(e) => handleBasicSearchChange('riskLevel', e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setAdvancedSearchOpen(true)}
                  >
                    Advanced
                  </Button>
                  <Button
                    variant="text"
                    onClick={clearFilters}
                  >
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <DataGrid
            rows={gameUsers?.users || []}
            columns={gameUserColumns}
            loading={isLoading}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <UserBehaviorAnalytics />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <AutomatedModerationTools />
        </TabPanel>
      </Paper>

      {/* Advanced Search Dialog */}
      <GameUserAdvancedSearch
        open={advancedSearchOpen}
        onClose={() => setAdvancedSearchOpen(false)}
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
      />

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ban User: {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Ban Reason"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Duration (days, leave empty for permanent)"
            type="number"
            value={banDuration}
            onChange={(e) => setBanDuration(e.target.value)}
            helperText="Leave empty for permanent ban"
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action will immediately prevent the user from accessing the game.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmBan}
            color="error"
            variant="contained"
            disabled={!banReason || banUserMutation.isPending}
          >
            {banUserMutation.isPending ? 'Banning...' : 'Ban User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameUserManagement;