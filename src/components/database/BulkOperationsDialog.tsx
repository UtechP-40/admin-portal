import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { GridRowId } from '@mui/x-data-grid';
import { useMutation } from '@tanstack/react-query';
import { DatabaseService } from '../../services/database';
import type { CollectionMetadata, BulkOperation } from '../../types/api';

interface BulkOperationsDialogProps {
  open: boolean;
  onClose: () => void;
  collection: CollectionMetadata;
  selectedRows: GridRowId[];
  onSuccess: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bulk-tabpanel-${index}`}
      aria-labelledby={`bulk-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const BulkOperationsDialog: React.FC<BulkOperationsDialogProps> = ({
  open,
  onClose,
  collection,
  selectedRows,
  onSuccess
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [operations, setOperations] = useState<BulkOperation[]>([
    { operation: 'insert', data: {} }
  ]);
  const [jsonOperations, setJsonOperations] = useState('[]');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const bulkMutation = useMutation({
    mutationFn: (ops: BulkOperation[]) => DatabaseService.bulkOperations(collection.name, ops),
    onSuccess: () => {
      onSuccess();
      onClose();
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 1 && tabValue === 0) {
      // Switching to JSON tab - convert operations to JSON
      setJsonOperations(JSON.stringify(operations, null, 2));
    } else if (newValue === 0 && tabValue === 1) {
      // Switching to form tab - parse JSON
      try {
        const parsed = JSON.parse(jsonOperations);
        setOperations(parsed);
        setJsonError(null);
      } catch (error) {
        setJsonError('Invalid JSON format');
        return;
      }
    }
    setTabValue(newValue);
  };

  const handleJsonChange = (value: string) => {
    setJsonOperations(value);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const addOperation = () => {
    setOperations([...operations, { operation: 'insert', data: {} }]);
  };

  const removeOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index));
  };

  const updateOperation = (index: number, field: keyof BulkOperation, value: any) => {
    const updated = [...operations];
    updated[index] = { ...updated[index], [field]: value };
    setOperations(updated);
  };

  const handleSubmit = () => {
    let opsToExecute = operations;

    if (tabValue === 1) {
      try {
        opsToExecute = JSON.parse(jsonOperations);
      } catch (error) {
        setJsonError('Invalid JSON format');
        return;
      }
    }

    bulkMutation.mutate(opsToExecute);
  };

  const generateSelectedRowsOperations = () => {
    if (selectedRows.length === 0) return;

    const deleteOps: BulkOperation[] = selectedRows.map(id => ({
      operation: 'delete',
      filter: { _id: id }
    }));

    setOperations(deleteOps);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Bulk Operations - {collection.name}
        {selectedRows.length > 0 && (
          <Chip 
            label={`${selectedRows.length} rows selected`} 
            color="primary" 
            size="small" 
            sx={{ ml: 2 }}
          />
        )}
      </DialogTitle>
      
      <DialogContent dividers>
        {selectedRows.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You have {selectedRows.length} rows selected. 
            <Button 
              size="small" 
              onClick={generateSelectedRowsOperations}
              sx={{ ml: 1 }}
            >
              Generate Delete Operations
            </Button>
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Form Builder" />
            <Tab label="JSON Editor" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Operations
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addOperation}
                variant="outlined"
                size="small"
              >
                Add Operation
              </Button>
            </Box>

            {operations.map((operation, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }} variant="outlined">
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    Operation {index + 1}
                  </Typography>
                  <IconButton 
                    onClick={() => removeOperation(index)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Operation Type</InputLabel>
                    <Select
                      value={operation.operation}
                      label="Operation Type"
                      onChange={(e) => updateOperation(index, 'operation', e.target.value)}
                    >
                      <MenuItem value="insert">Insert</MenuItem>
                      <MenuItem value="update">Update</MenuItem>
                      <MenuItem value="delete">Delete</MenuItem>
                    </Select>
                  </FormControl>

                  {operation.operation === 'update' && (
                    <FormControl fullWidth>
                      <InputLabel>Upsert</InputLabel>
                      <Select
                        value={operation.upsert ? 'true' : 'false'}
                        label="Upsert"
                        onChange={(e) => updateOperation(index, 'upsert', e.target.value === 'true')}
                      >
                        <MenuItem value="false">No</MenuItem>
                        <MenuItem value="true">Yes</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Box>

                {(operation.operation === 'update' || operation.operation === 'delete') && (
                  <TextField
                    fullWidth
                    label="Filter (JSON)"
                    multiline
                    rows={3}
                    value={typeof operation.filter === 'object' ? JSON.stringify(operation.filter, null, 2) : operation.filter || ''}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        updateOperation(index, 'filter', parsed);
                      } catch {
                        updateOperation(index, 'filter', e.target.value);
                      }
                    }}
                    helperText="MongoDB filter query in JSON format"
                    sx={{ mb: 2 }}
                  />
                )}

                {(operation.operation === 'insert' || operation.operation === 'update') && (
                  <TextField
                    fullWidth
                    label="Data (JSON)"
                    multiline
                    rows={4}
                    value={typeof operation.data === 'object' ? JSON.stringify(operation.data, null, 2) : operation.data || ''}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        updateOperation(index, 'data', parsed);
                      } catch {
                        updateOperation(index, 'data', e.target.value);
                      }
                    }}
                    helperText="Document data in JSON format"
                  />
                )}
              </Paper>
            ))}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Define bulk operations as a JSON array. Each operation should have an "operation" field 
              ("insert", "update", or "delete") and appropriate data/filter fields.
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={15}
                value={jsonOperations}
                onChange={(e) => handleJsonChange(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  },
                }}
                placeholder={`[
  {
    "operation": "insert",
    "data": { "name": "New Document" }
  },
  {
    "operation": "update",
    "filter": { "status": "pending" },
    "data": { "status": "active" },
    "upsert": false
  },
  {
    "operation": "delete",
    "filter": { "expired": true }
  }
]`}
              />
            </Paper>
            
            {jsonError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {jsonError}
              </Alert>
            )}
          </Box>
        </TabPanel>

        {bulkMutation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {bulkMutation.error instanceof Error ? bulkMutation.error.message : 'Operation failed'}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={bulkMutation.isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={bulkMutation.isLoading || (tabValue === 1 && !!jsonError)}
        >
          {bulkMutation.isLoading ? 'Executing...' : 'Execute Operations'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkOperationsDialog;