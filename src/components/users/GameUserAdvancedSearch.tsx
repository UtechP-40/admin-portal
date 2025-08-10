import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementApi } from '../../services/userManagementApi';

interface GameUserAdvancedSearchProps {
  open: boolean;
  onClose: () => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
}

interface SearchPreset {
  id: string;
  name: string;
  description?: string;
  searchCriteria: any;
  createdAt: string;
}

const GameUserAdvancedSearch: React.FC<GameUserAdvancedSearchProps> = ({
  open,
  onClose,
  filters,
  onFiltersChange
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [savePresetOpen, setSavePresetOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch search presets
  const { data: searchPresets } = useQuery({
    queryKey: ['searchPresets'],
    queryFn: () => userManagementApi.getSearchPresets()
  });

  // Save preset mutation
  const savePresetMutation = useMutation({
    mutationFn: (preset: { name: string; description?: string; searchCriteria: any }) =>
      userManagementApi.saveSearchPreset(preset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchPresets'] });
      setSavePresetOpen(false);
      setPresetName('');
      setPresetDescription('');
    }
  });

  // Delete preset mutation
  const deletePresetMutation = useMutation({
    mutationFn: (id: string) => userManagementApi.deleteSearchPreset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchPresets'] });
    }
  });

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (category: string, field: string, value: any) => {
    setLocalFilters((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      basicSearch: { username: '', email: '' },
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
      }
    };
    setLocalFilters(clearedFilters);
  };

  const handleLoadPreset = (preset: SearchPreset) => {
    setLocalFilters(preset.searchCriteria);
  };

  const handleSavePreset = () => {
    if (presetName.trim()) {
      savePresetMutation.mutate({
        name: presetName.trim(),
        description: presetDescription.trim() || undefined,
        searchCriteria: localFilters
      });
    }
  };

  const handleDeletePreset = (presetId: string) => {
    if (window.confirm('Are you sure you want to delete this search preset?')) {
      deletePresetMutation.mutate(presetId);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    
    // Basic search
    if (localFilters.basicSearch?.username) count++;
    if (localFilters.basicSearch?.email) count++;
    
    // Activity filters
    if (localFilters.activityFilters?.gamesPlayedMin) count++;
    if (localFilters.activityFilters?.gamesPlayedMax) count++;
    if (localFilters.activityFilters?.winRateMin) count++;
    if (localFilters.activityFilters?.winRateMax) count++;
    if (localFilters.activityFilters?.lastActiveAfter) count++;
    if (localFilters.activityFilters?.lastActiveBefore) count++;
    
    // Behavior filters
    if (localFilters.behaviorFilters?.riskLevel && localFilters.behaviorFilters.riskLevel !== 'all') count++;
    if (localFilters.behaviorFilters?.suspiciousActivityScoreMin) count++;
    if (localFilters.behaviorFilters?.suspiciousActivityScoreMax) count++;
    if (localFilters.behaviorFilters?.flagged) count++;
    if (localFilters.behaviorFilters?.banned) count++;
    
    // Date filters
    if (localFilters.dateFilters?.joinedAfter) count++;
    if (localFilters.dateFilters?.joinedBefore) count++;
    
    return count;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Advanced User Search</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getActiveFiltersCount() > 0 && (
                <Chip 
                  label={`${getActiveFiltersCount()} active filters`} 
                  color="primary" 
                  size="small" 
                />
              )}
              <Tooltip title="Clear all filters">
                <IconButton onClick={handleClearFilters}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Search Presets */}
          {searchPresets && searchPresets.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Saved Search Presets
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {searchPresets.map((preset: SearchPreset) => (
                  <Chip
                    key={preset.id}
                    label={preset.name}
                    onClick={() => handleLoadPreset(preset)}
                    onDelete={() => handleDeletePreset(preset.id)}
                    deleteIcon={<DeleteIcon />}
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
              <Divider sx={{ mt: 2, mb: 2 }} />
            </Box>
          )}

          {/* Basic Search */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Basic Search</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={localFilters.basicSearch?.username || ''}
                    onChange={(e) => handleFilterChange('basicSearch', 'username', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={localFilters.basicSearch?.email || ''}
                    onChange={(e) => handleFilterChange('basicSearch', 'email', e.target.value)}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Activity Filters */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Activity Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Min Games Played"
                    type="number"
                    value={localFilters.activityFilters?.gamesPlayedMin || ''}
                    onChange={(e) => handleFilterChange('activityFilters', 'gamesPlayedMin', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Games Played"
                    type="number"
                    value={localFilters.activityFilters?.gamesPlayedMax || ''}
                    onChange={(e) => handleFilterChange('activityFilters', 'gamesPlayedMax', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Min Win Rate (%)"
                    type="number"
                    inputProps={{ min: 0, max: 100 }}
                    value={localFilters.activityFilters?.winRateMin || ''}
                    onChange={(e) => handleFilterChange('activityFilters', 'winRateMin', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Win Rate (%)"
                    type="number"
                    inputProps={{ min: 0, max: 100 }}
                    value={localFilters.activityFilters?.winRateMax || ''}
                    onChange={(e) => handleFilterChange('activityFilters', 'winRateMax', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Last Active After"
                    value={localFilters.activityFilters?.lastActiveAfter}
                    onChange={(date) => handleFilterChange('activityFilters', 'lastActiveAfter', date)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Last Active Before"
                    value={localFilters.activityFilters?.lastActiveBefore}
                    onChange={(date) => handleFilterChange('activityFilters', 'lastActiveBefore', date)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Behavior Filters */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Behavior & Risk Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Risk Level</InputLabel>
                    <Select
                      value={localFilters.behaviorFilters?.riskLevel || 'all'}
                      onChange={(e) => handleFilterChange('behaviorFilters', 'riskLevel', e.target.value)}
                    >
                      <MenuItem value="all">All Risk Levels</MenuItem>
                      <MenuItem value="low">Low Risk</MenuItem>
                      <MenuItem value="medium">Medium Risk</MenuItem>
                      <MenuItem value="high">High Risk</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Account Status</InputLabel>
                    <Select
                      value={
                        localFilters.behaviorFilters?.banned ? 'banned' :
                        localFilters.behaviorFilters?.flagged ? 'flagged' : 'all'
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        handleFilterChange('behaviorFilters', 'banned', value === 'banned');
                        handleFilterChange('behaviorFilters', 'flagged', value === 'flagged');
                      }}
                    >
                      <MenuItem value="all">All Users</MenuItem>
                      <MenuItem value="flagged">Flagged Users</MenuItem>
                      <MenuItem value="banned">Banned Users</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Min Suspicious Activity Score"
                    type="number"
                    inputProps={{ min: 0, max: 100 }}
                    value={localFilters.behaviorFilters?.suspiciousActivityScoreMin || ''}
                    onChange={(e) => handleFilterChange('behaviorFilters', 'suspiciousActivityScoreMin', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Suspicious Activity Score"
                    type="number"
                    inputProps={{ min: 0, max: 100 }}
                    value={localFilters.behaviorFilters?.suspiciousActivityScoreMax || ''}
                    onChange={(e) => handleFilterChange('behaviorFilters', 'suspiciousActivityScoreMax', e.target.value)}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Date Filters */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Registration Date Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Joined After"
                    value={localFilters.dateFilters?.joinedAfter}
                    onChange={(date) => handleFilterChange('dateFilters', 'joinedAfter', date)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Joined Before"
                    value={localFilters.dateFilters?.joinedBefore}
                    onChange={(date) => handleFilterChange('dateFilters', 'joinedBefore', date)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Save Preset Section */}
          {!savePresetOpen && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => setSavePresetOpen(true)}
              >
                Save Search as Preset
              </Button>
            </Box>
          )}

          {savePresetOpen && (
            <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Save Search Preset
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Preset Name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Description (optional)"
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleSavePreset}
                      disabled={!presetName.trim() || savePresetMutation.isPending}
                    >
                      Save Preset
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSavePresetOpen(false);
                        setPresetName('');
                        setPresetDescription('');
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {getActiveFiltersCount() > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} will be applied to the search.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleClearFilters} startIcon={<ClearIcon />}>
            Clear All
          </Button>
          <Button
            onClick={handleApplyFilters}
            variant="contained"
            startIcon={<SearchIcon />}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default GameUserAdvancedSearch;