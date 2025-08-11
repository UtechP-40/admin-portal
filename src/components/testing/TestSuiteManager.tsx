import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Menu,
  MenuItem,
  Divider,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  FileCopy as FileCopyIcon,
  GetApp as GetAppIcon,
  Publish as PublishIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testingService } from '../../services/testingService';
import type { TestSuite, ApiTest, TestExecution } from '../../types/testing';

interface TestSuiteManagerProps {
  onSelectSuite?: (suite: TestSuite) => void;
  selectedSuiteId?: string;
}

export function TestSuiteManager({ onSelectSuite, selectedSuiteId }: TestSuiteManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [newSuite, setNewSuite] = useState({
    name: '',
    description: '',
    environment: 'development',
    tags: [] as string[],
  });

  const queryClient = useQueryClient();

  const { data: testSuites = [], isLoading } = useQuery({
    queryKey: ['test-suites'],
    queryFn: testingService.getTestSuites,
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['test-executions'],
    queryFn: () => testingService.getTestExecutions(),
  });

  const createSuiteMutation = useMutation({
    mutationFn: testingService.createTestSuite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites'] });
      setShowCreateDialog(false);
      setNewSuite({ name: '', description: '', environment: 'development', tags: [] });
    },
  });

  const updateSuiteMutation = useMutation({
    mutationFn: ({ id, suite }: { id: string; suite: Partial<TestSuite> }) =>
      testingService.updateTestSuite(id, suite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites'] });
      setShowEditDialog(false);
      setEditingSuite(null);
    },
  });

  const deleteSuiteMutation = useMutation({
    mutationFn: testingService.deleteTestSuite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites'] });
    },
  });

  const duplicateSuiteMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      testingService.duplicateTestSuite(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites'] });
    },
  });

  const executeSuiteMutation = useMutation({
    mutationFn: ({ suiteId, environment }: { suiteId: string; environment?: string }) =>
      testingService.executeTestSuite(suiteId, environment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-executions'] });
    },
  });

  const importSuiteMutation = useMutation({
    mutationFn: testingService.importTestSuite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites'] });
      setShowImportDialog(false);
      setImportFile(null);
    },
  });

  const handleCreateSuite = () => {
    createSuiteMutation.mutate({
      ...newSuite,
      tests: [],
      isActive: true,
    } as any);
  };

  const handleEditSuite = (suite: TestSuite) => {
    setEditingSuite(suite);
    setShowEditDialog(true);
  };

  const handleUpdateSuite = () => {
    if (editingSuite) {
      updateSuiteMutation.mutate({
        id: editingSuite.id,
        suite: editingSuite,
      });
    }
  };

  const handleDeleteSuite = (suiteId: string) => {
    if (window.confirm('Are you sure you want to delete this test suite?')) {
      deleteSuiteMutation.mutate(suiteId);
    }
  };

  const handleDuplicateSuite = (suite: TestSuite) => {
    const name = prompt('Enter name for duplicated suite:', `${suite.name} (Copy)`);
    if (name) {
      duplicateSuiteMutation.mutate({ id: suite.id, name });
    }
  };

  const handleExecuteSuite = (suite: TestSuite) => {
    executeSuiteMutation.mutate({ suiteId: suite.id, environment: suite.environment });
  };

  const handleExportSuite = async (suite: TestSuite, format: 'json' | 'postman') => {
    try {
      const blob = await testingService.exportTestSuite(suite.id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${suite.name}.${format === 'postman' ? 'json' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImportSuite = () => {
    if (importFile) {
      importSuiteMutation.mutate(importFile);
    }
  };

  const getLastExecution = (suiteId: string) => {
    return executions
      .filter(exec => exec.suiteId === suiteId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'running': return 'info';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Test Suites</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PublishIcon />}
            onClick={() => setShowImportDialog(true)}
          >
            Import
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
          >
            Create Suite
          </Button>
        </Box>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2}>
        <AnimatePresence>
          {testSuites.map((suite) => {
            const lastExecution = getLastExecution(suite.id);
            const isSelected = selectedSuiteId === suite.id;
            
            return (
              <Grid item xs={12} md={6} lg={4} key={suite.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: isSelected ? 2 : 1,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      '&:hover': {
                        boxShadow: 3,
                      },
                    }}
                    onClick={() => onSelectSuite?.(suite)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="h3" noWrap>
                          {suite.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSuite(suite);
                            setAnchorEl(e.currentTarget);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {suite.description || 'No description'}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip size="small" label={suite.environment} color="primary" />
                        <Chip size="small" label={`${suite.tests.length} tests`} />
                        {suite.tags.map((tag) => (
                          <Chip key={tag} size="small" label={tag} variant="outlined" />
                        ))}
                      </Box>

                      {lastExecution && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            size="small"
                            label={lastExecution.status}
                            color={getExecutionStatusColor(lastExecution.status) as any}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(lastExecution.startTime).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>

                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<PlayArrowIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecuteSuite(suite);
                        }}
                        disabled={executeSuiteMutation.isPending}
                      >
                        Run
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSuite(suite);
                        }}
                      >
                        Edit
                      </Button>
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </AnimatePresence>
      </Grid>

      {testSuites.length === 0 && !isLoading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No test suites found. Create your first test suite to get started.
        </Alert>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          if (selectedSuite) handleEditSuite(selectedSuite);
          setAnchorEl(null);
        }}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedSuite) handleDuplicateSuite(selectedSuite);
          setAnchorEl(null);
        }}>
          <FileCopyIcon sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          if (selectedSuite) handleExportSuite(selectedSuite, 'json');
          setAnchorEl(null);
        }}>
          <GetAppIcon sx={{ mr: 1 }} />
          Export as JSON
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedSuite) handleExportSuite(selectedSuite, 'postman');
          setAnchorEl(null);
        }}>
          <GetAppIcon sx={{ mr: 1 }} />
          Export as Postman
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            if (selectedSuite) handleDeleteSuite(selectedSuite.id);
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Suite Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Test Suite</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={newSuite.name}
            onChange={(e) => setNewSuite({ ...newSuite, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={newSuite.description}
            onChange={(e) => setNewSuite({ ...newSuite, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Environment</InputLabel>
            <Select
              value={newSuite.environment}
              onChange={(e) => setNewSuite({ ...newSuite, environment: e.target.value })}
              label="Environment"
            >
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="staging">Staging</MenuItem>
              <MenuItem value="production">Production</MenuItem>
            </Select>
          </FormControl>
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={newSuite.tags}
            onChange={(_, value) => setNewSuite({ ...newSuite, tags: value })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Add tags..."
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateSuite} 
            variant="contained"
            disabled={!newSuite.name || createSuiteMutation.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Suite Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Test Suite</DialogTitle>
        <DialogContent>
          {editingSuite && (
            <>
              <TextField
                fullWidth
                label="Name"
                value={editingSuite.name}
                onChange={(e) => setEditingSuite({ ...editingSuite, name: e.target.value })}
                sx={{ mb: 2, mt: 1 }}
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editingSuite.description}
                onChange={(e) => setEditingSuite({ ...editingSuite, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={editingSuite.environment}
                  onChange={(e) => setEditingSuite({ ...editingSuite, environment: e.target.value })}
                  label="Environment"
                >
                  <MenuItem value="development">Development</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                </Select>
              </FormControl>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={editingSuite.tags}
                onChange={(_, value) => setEditingSuite({ ...editingSuite, tags: value })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags..."
                  />
                )}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateSuite} 
            variant="contained"
            disabled={!editingSuite?.name || updateSuiteMutation.isPending}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Suite Dialog */}
      <Dialog open={showImportDialog} onClose={() => setShowImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Test Suite</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              style={{ marginBottom: 16 }}
            />
            <Typography variant="body2" color="text.secondary">
              Import test suites from JSON files or Postman collections.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleImportSuite} 
            variant="contained"
            disabled={!importFile || importSuiteMutation.isPending}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}