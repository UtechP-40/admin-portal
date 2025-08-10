import React, { useState, useEffect } from 'react';
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
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  PlayArrow as ExecuteIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Assessment as AnalysisIcon,
  Template as TemplateIcon
} from '@mui/icons-material';
import type { GridRowId } from '@mui/x-data-grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatabaseService } from '../../services/database';
import { BulkOperationsService } from '../../services/bulkOperations';
import type { CollectionMetadata, BulkOperation } from '../../types/api';
import type { 
  BulkOperationPreview, 
  OperationTemplate, 
  SavedQuery 
} from '../../types/database';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [useTransaction, setUseTransaction] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [continueOnError, setContinueOnError] = useState(false);
  const [batchSize, setBatchSize] = useState(100);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateTags, setTemplateTags] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [preview, setPreview] = useState<BulkOperationPreview[]>([]);
  const [impactAnalysis, setImpactAnalysis] = useState<any>(null);

  const queryClient = useQueryClient();

  // Fetch operation templates
  const { data: templates = [] } = useQuery({
    queryKey: ['operation-templates', collection.name],
    queryFn: () => BulkOperationsService.getOperationTemplates(collection.name),
    enabled: open
  });

  // Fetch saved queries
  const { data: savedQueries = [] } = useQuery({
    queryKey: ['saved-queries', collection.name],
    queryFn: () => BulkOperationsService.getSavedQueries(collection.name),
    enabled: open
  });

  // Enhanced bulk operations mutation with transaction support
  const bulkMutation = useMutation({
    mutationFn: (ops: BulkOperation[]) => 
      BulkOperationsService.executeBulkOperations(collection.name, ops, {
        useTransaction,
        dryRun,
        continueOnError,
        batchSize
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    }
  });

  // Preview operations mutation
  const previewMutation = useMutation({
    mutationFn: (ops: BulkOperation[]) => 
      BulkOperationsService.previewBulkOperations(collection.name, ops),
    onSuccess: (data) => {
      setPreview(data);
      setCurrentStep(1);
    }
  });

  // Impact analysis mutation
  const impactMutation = useMutation({
    mutationFn: (ops: BulkOperation[]) => 
      BulkOperationsService.analyzeOperationImpact(collection.name, ops),
    onSuccess: (data) => {
      setImpactAnalysis(data);
    }
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: (template: Omit<OperationTemplate, 'id' | 'createdAt' | 'lastUsed' | 'useCount'>) =>
      BulkOperationsService.saveOperationTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation-templates'] });
      setTemplateName('');
      setTemplateDescription('');
      setTemplateTags([]);
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

  const handlePreview = () => {
    let opsToPreview = operations;

    if (tabValue === 1) {
      try {
        opsToPreview = JSON.parse(jsonOperations);
      } catch (error) {
        setJsonError('Invalid JSON format');
        return;
      }
    }

    previewMutation.mutate(opsToPreview);
    impactMutation.mutate(opsToPreview);
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

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;

    const template = {
      name: templateName,
      description: templateDescription,
      collection: collection.name,
      operations,
      tags: templateTags,
      createdBy: 'current-user' // This should come from auth context
    };

    saveTemplateMutation.mutate(template);
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setOperations(template.operations);
      setJsonOperations(JSON.stringify(template.operations, null, 2));
    }
  };

  const generateSelectedRowsOperations = () => {
    if (selectedRows.length === 0) return;

    const deleteOps: BulkOperation[] = selectedRows.map(id => ({
      operation: 'delete',
      filter: { _id: id }
    }));

    setOperations(deleteOps);
  };

  const addTag = (tag: string) => {
    if (tag && !templateTags.includes(tag)) {
      setTemplateTags([...templateTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTemplateTags(templateTags.filter(tag => tag !== tagToRemove));
  };

  const steps = [
    'Configure Operations',
    'Preview & Analysis',
    'Execute'
  ];

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
        {/* Step Progress */}
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={currentStep} orientation="horizontal">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

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

        {/* Step 1: Configure Operations */}
        {currentStep === 0 && (
          <Box>
            {/* Templates Section */}
            {templates.length > 0 && (
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TemplateIcon />
                    <Typography>Load from Template ({templates.length})</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Template</InputLabel>
                    <Select
                      value={selectedTemplate}
                      label="Select Template"
                      onChange={(e) => {
                        setSelectedTemplate(e.target.value);
                        handleLoadTemplate(e.target.value);
                      }}
                    >
                      {templates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name} - {template.description}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Operation Configuration Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Form Builder" />
                <Tab label="JSON Editor" />
                <Tab label="Save Template" />
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

                {/* Execution Options */}
                <Paper sx={{ p: 2, mt: 2 }} variant="outlined">
                  <Typography variant="h6" sx={{ mb: 2 }}>Execution Options</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useTransaction}
                          onChange={(e) => setUseTransaction(e.target.checked)}
                        />
                      }
                      label="Use Transaction"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={dryRun}
                          onChange={(e) => setDryRun(e.target.checked)}
                        />
                      }
                      label="Dry Run (Preview Only)"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={continueOnError}
                          onChange={(e) => setContinueOnError(e.target.checked)}
                        />
                      }
                      label="Continue on Error"
                    />
                    <TextField
                      label="Batch Size"
                      type="number"
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                      inputProps={{ min: 1, max: 1000 }}
                    />
                  </Box>
                </Paper>
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

            <TabPanel value={tabValue} index={2}>
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Save as Template</Typography>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Tags</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {templateTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => removeTag(tag)}
                        size="small"
                      />
                    ))}
                  </Box>
                  <TextField
                    size="small"
                    placeholder="Add tag and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addTag((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </Box>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim() || saveTemplateMutation.isLoading}
                >
                  {saveTemplateMutation.isLoading ? 'Saving...' : 'Save Template'}
                </Button>
              </Box>
            </TabPanel>
          </Box>
        )}

        {/* Step 2: Preview & Analysis */}
        {currentStep === 1 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Operation Preview & Impact Analysis</Typography>
            
            {/* Operation Preview */}
            {preview.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Preview Results</Typography>
                {preview.map((previewItem, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {BulkOperationsService.formatOperationSummary(previewItem.operation)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Estimated affected documents: {previewItem.affectedCount}
                      </Typography>
                      
                      {previewItem.warnings.length > 0 && (
                        <Alert severity="warning" sx={{ mb: 1 }}>
                          <Typography variant="subtitle2">Warnings:</Typography>
                          {previewItem.warnings.map((warning, wIndex) => (
                            <Typography key={wIndex} variant="body2">• {warning}</Typography>
                          ))}
                        </Alert>
                      )}
                      
                      {previewItem.errors.length > 0 && (
                        <Alert severity="error" sx={{ mb: 1 }}>
                          <Typography variant="subtitle2">Errors:</Typography>
                          {previewItem.errors.map((error, eIndex) => (
                            <Typography key={eIndex} variant="body2">• {error}</Typography>
                          ))}
                        </Alert>
                      )}
                      
                      {previewItem.sampleDocuments.length > 0 && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Sample Documents ({previewItem.sampleDocuments.length})</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Paper variant="outlined" sx={{ p: 1 }}>
                              <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>
                                {JSON.stringify(previewItem.sampleDocuments, null, 2)}
                              </pre>
                            </Paper>
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {/* Impact Analysis */}
            {impactAnalysis && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Impact Analysis</Typography>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Estimated Affected Documents</Typography>
                        <Typography variant="h6">{impactAnalysis.estimatedAffectedDocuments}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Performance Impact</Typography>
                        <Chip 
                          label={impactAnalysis.performanceImpact} 
                          color={
                            impactAnalysis.performanceImpact === 'high' ? 'error' :
                            impactAnalysis.performanceImpact === 'medium' ? 'warning' : 'success'
                          }
                        />
                      </Box>
                    </Box>
                    
                    {impactAnalysis.warnings.length > 0 && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Warnings:</Typography>
                        {impactAnalysis.warnings.map((warning: string, index: number) => (
                          <Typography key={index} variant="body2">• {warning}</Typography>
                        ))}
                      </Alert>
                    )}
                    
                    {impactAnalysis.recommendations.length > 0 && (
                      <Alert severity="info">
                        <Typography variant="subtitle2">Recommendations:</Typography>
                        {impactAnalysis.recommendations.map((rec: string, index: number) => (
                          <Typography key={index} variant="body2">• {rec}</Typography>
                        ))}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setCurrentStep(0)}
              >
                Back to Configuration
              </Button>
              <Button
                variant="contained"
                onClick={() => setCurrentStep(2)}
                disabled={preview.some(p => p.errors.length > 0)}
              >
                Proceed to Execute
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 3: Execute */}
        {currentStep === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Execute Operations</Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              You are about to execute {operations.length} operation(s). This action cannot be undone unless you have enabled transactions.
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setCurrentStep(1)}
              >
                Back to Preview
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<ExecuteIcon />}
                onClick={handleSubmit}
                disabled={bulkMutation.isLoading}
              >
                {bulkMutation.isLoading ? 'Executing...' : 'Execute Operations'}
              </Button>
            </Box>
          </Box>
        )}

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
        {currentStep === 0 && (
          <Button 
            onClick={handlePreview}
            variant="contained"
            startIcon={<PreviewIcon />}
            disabled={previewMutation.isLoading || (tabValue === 1 && !!jsonError) || operations.length === 0}
          >
            {previewMutation.isLoading ? 'Analyzing...' : 'Preview Operations'}
          </Button>
        )}
        {currentStep === 1 && (
          <Button 
            onClick={() => setCurrentStep(2)}
            variant="contained"
            disabled={preview.some(p => p.errors.length > 0)}
          >
            Proceed to Execute
          </Button>
        )}
        {currentStep === 2 && (
          <Button 
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            startIcon={<ExecuteIcon />}
            disabled={bulkMutation.isLoading}
          >
            {bulkMutation.isLoading ? 'Executing...' : 'Execute Operations'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkOperationsDialog;