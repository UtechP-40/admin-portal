import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Autocomplete,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useMutation } from '@tanstack/react-query';
import { DatabaseService } from '../../services/database';
import type { CollectionMetadata, QueryBuilderOptions } from '../../types/api';

interface QueryBuilderProps {
  collections: CollectionMetadata[];
  onResults?: (results: any) => void;
}

interface QueryCondition {
  field: string;
  operator: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'date';
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
      id={`query-tabpanel-${index}`}
      aria-labelledby={`query-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const QueryBuilder: React.FC<QueryBuilderProps> = ({ collections, onResults }) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [conditions, setConditions] = useState<QueryCondition[]>([]);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [limit, setLimit] = useState(100);
  const [skip, setSkip] = useState(0);
  const [selectFields, setSelectFields] = useState<string[]>([]);
  const [rawQuery, setRawQuery] = useState('{}');
  const [results, setResults] = useState<any>(null);

  const queryMutation = useMutation({
    mutationFn: (options: QueryBuilderOptions) => DatabaseService.executeQuery(options),
    onSuccess: (data) => {
      setResults(data);
      if (onResults) {
        onResults(data);
      }
    }
  });

  const selectedCollectionData = collections.find(c => c.name === selectedCollection);
  const availableFields = selectedCollectionData?.schema?.fields 
    ? Object.keys(selectedCollectionData.schema.fields)
    : [];

  const operators = {
    string: ['equals', 'contains', 'startsWith', 'endsWith', 'regex', 'in', 'nin'],
    number: ['equals', 'gt', 'gte', 'lt', 'lte', 'in', 'nin'],
    boolean: ['equals'],
    date: ['equals', 'gt', 'gte', 'lt', 'lte', 'between']
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: '', operator: 'equals', value: '', type: 'string' }
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof QueryCondition, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-detect field type from schema
    if (field === 'field' && selectedCollectionData?.schema?.fields) {
      const fieldInfo = selectedCollectionData.schema.fields[value];
      if (fieldInfo) {
        let type: QueryCondition['type'] = 'string';
        switch (fieldInfo.type.toLowerCase()) {
          case 'number':
            type = 'number';
            break;
          case 'boolean':
            type = 'boolean';
            break;
          case 'date':
            type = 'date';
            break;
        }
        updated[index].type = type;
        updated[index].operator = 'equals'; // Reset operator when field changes
      }
    }
    
    setConditions(updated);
  };

  const buildMongoQuery = () => {
    if (conditions.length === 0) return {};

    const query: any = {};

    conditions.forEach(condition => {
      if (!condition.field || !condition.value) return;

      let value: any = condition.value;

      // Convert value based on type
      switch (condition.type) {
        case 'number':
          value = Number(condition.value);
          break;
        case 'boolean':
          value = condition.value === 'true';
          break;
        case 'date':
          value = new Date(condition.value);
          break;
      }

      // Apply operator
      switch (condition.operator) {
        case 'equals':
          query[condition.field] = value;
          break;
        case 'contains':
          query[condition.field] = { $regex: value, $options: 'i' };
          break;
        case 'startsWith':
          query[condition.field] = { $regex: `^${value}`, $options: 'i' };
          break;
        case 'endsWith':
          query[condition.field] = { $regex: `${value}$`, $options: 'i' };
          break;
        case 'regex':
          query[condition.field] = { $regex: value };
          break;
        case 'gt':
          query[condition.field] = { $gt: value };
          break;
        case 'gte':
          query[condition.field] = { $gte: value };
          break;
        case 'lt':
          query[condition.field] = { $lt: value };
          break;
        case 'lte':
          query[condition.field] = { $lte: value };
          break;
        case 'in':
          query[condition.field] = { $in: value.split(',').map((v: string) => v.trim()) };
          break;
        case 'nin':
          query[condition.field] = { $nin: value.split(',').map((v: string) => v.trim()) };
          break;
      }
    });

    return query;
  };

  const executeQuery = () => {
    if (!selectedCollection) return;

    let queryOptions: QueryBuilderOptions = {
      collection: selectedCollection,
      limit,
      skip
    };

    if (tabValue === 0) {
      // Visual query builder
      const filter = buildMongoQuery();
      if (Object.keys(filter).length > 0) {
        queryOptions.filter = filter;
      }

      if (sortField) {
        queryOptions.sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
      }

      if (selectFields.length > 0) {
        queryOptions.select = selectFields.join(' ');
      }
    } else {
      // Raw query
      try {
        const parsedQuery = JSON.parse(rawQuery);
        queryOptions.filter = parsedQuery;
      } catch (error) {
        return;
      }
    }

    queryMutation.mutate(queryOptions);
  };

  const clearQuery = () => {
    setConditions([]);
    setSortField('');
    setSortOrder('desc');
    setSelectFields([]);
    setRawQuery('{}');
    setResults(null);
  };

  // Generate columns for results
  const resultColumns: GridColDef[] = results?.documents?.length > 0 
    ? Object.keys(results.documents[0]).map(key => ({
        field: key,
        headerName: key,
        width: 150,
        renderCell: (params) => {
          const value = params.value;
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          return String(value);
        }
      }))
    : [];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Query Builder
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Collection</InputLabel>
                <Select
                  value={selectedCollection}
                  label="Collection"
                  onChange={(e) => setSelectedCollection(e.target.value)}
                >
                  {collections.map(collection => (
                    <MenuItem key={collection.name} value={collection.name}>
                      {collection.name} ({DatabaseService.formatCount(collection.count)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                label="Limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                fullWidth
                inputProps={{ min: 1, max: 1000 }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                label="Skip"
                type="number"
                value={skip}
                onChange={(e) => setSkip(Number(e.target.value))}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<RunIcon />}
                  onClick={executeQuery}
                  disabled={!selectedCollection || queryMutation.isPending}
                >
                  {queryMutation.isPending ? 'Running...' : 'Run Query'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearQuery}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {selectedCollection && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Visual Builder" />
              <Tab label="Raw Query" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  Filter Conditions
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addCondition}
                  size="small"
                >
                  Add Condition
                </Button>
              </Box>

              {conditions.map((condition, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }} variant="outlined">
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3}>
                      <Autocomplete
                        options={availableFields}
                        value={condition.field}
                        onChange={(e, value) => updateCondition(index, 'field', value || '')}
                        renderInput={(params) => (
                          <TextField {...params} label="Field" size="small" />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={condition.operator}
                          label="Operator"
                          onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        >
                          {operators[condition.type].map(op => (
                            <MenuItem key={op} value={op}>
                              {op}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={3}>
                      <TextField
                        label="Value"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        size="small"
                        fullWidth
                        type={condition.type === 'number' ? 'number' : 
                              condition.type === 'date' ? 'datetime-local' : 'text'}
                      />
                    </Grid>
                    
                    <Grid item xs={2}>
                      <Chip label={condition.type} size="small" />
                    </Grid>
                    
                    <Grid item xs={2}>
                      <IconButton
                        onClick={() => removeCondition(index)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Sort & Select
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Autocomplete
                      options={availableFields}
                      value={sortField}
                      onChange={(e, value) => setSortField(value || '')}
                      renderInput={(params) => (
                        <TextField {...params} label="Sort Field" size="small" />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Order</InputLabel>
                      <Select
                        value={sortOrder}
                        label="Order"
                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      >
                        <MenuItem value="asc">Ascending</MenuItem>
                        <MenuItem value="desc">Descending</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Autocomplete
                      multiple
                      options={availableFields}
                      value={selectFields}
                      onChange={(e, value) => setSelectFields(value)}
                      renderInput={(params) => (
                        <TextField {...params} label="Select Fields (optional)" size="small" />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            size="small"
                            {...getTagProps({ index })}
                          />
                        ))
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Enter a MongoDB query in JSON format:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                placeholder='{"status": "active", "createdAt": {"$gte": "2024-01-01"}}'
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                  },
                }}
              />
            </Box>
          </TabPanel>
        </Paper>
      )}

      {queryMutation.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Query failed: {queryMutation.error instanceof Error ? queryMutation.error.message : 'Unknown error'}
        </Alert>
      )}

      {results && (
        <Paper>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Query Results ({results.documents?.length || 0} documents)
            </Typography>
            
            {results.documents?.length > 0 ? (
              <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={results.documents}
                  columns={resultColumns}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25 } },
                  }}
                  pageSizeOptions={[10, 25, 50]}
                  getRowId={(row) => row._id}
                  disableSelectionOnClick
                />
              </Box>
            ) : (
              <Typography color="text.secondary">
                No documents found matching the query.
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default QueryBuilder;