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
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  AccountTree as RelationshipIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Restore as RestoreIcon,
  Compare as CompareIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentVersioningService } from '../../services/documentVersioning';
import { DocumentRelationshipService } from '../../services/documentRelationships';
import type { 
  DocumentVersion, 
  DocumentRelationship, 
  DocumentSchema,
  SchemaField,
  ValidationError
} from '../../types/database';

interface DocumentEditorProps {
  open: boolean;
  document?: any;
  isNew?: boolean;
  collection: string;
  schema?: DocumentSchema;
  onSave: (data: any, comment?: string) => void;
  onClose: () => void;
  loading?: boolean;
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
      id={`document-tabpanel-${index}`}
      aria-labelledby={`document-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  open,
  document,
  isNew = false,
  collection,
  schema,
  onSave,
  onClose,
  loading = false
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonValue, setJsonValue] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationError[]>([]);
  const [saveComment, setSaveComment] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const queryClient = useQueryClient();

  // Fetch version history
  const { data: versions = [] } = useQuery({
    queryKey: ['document-versions', collection, document?._id],
    queryFn: () => DocumentVersioningService.getVersionHistory(collection, document._id),
    enabled: !isNew && !!document?._id
  });

  // Fetch relationships
  const { data: relationships = [] } = useQuery({
    queryKey: ['document-relationships', collection, document?._id],
    queryFn: () => DocumentRelationshipService.getDocumentRelationships(collection, document._id),
    enabled: !isNew && !!document?._id
  });

  // Fetch schema with relationships
  const { data: fullSchema } = useQuery({
    queryKey: ['schema-relationships', collection],
    queryFn: () => DocumentRelationshipService.getSchemaWithRelationships(collection),
    enabled: !!collection
  });

  // Create validation schema based on document schema
  const createValidationSchema = (docSchema?: DocumentSchema) => {
    if (!docSchema?.fields) {
      return yup.object().shape({
        data: yup.mixed().required('Document data is required')
      });
    }

    const schemaFields: any = {};
    Object.entries(docSchema.fields).forEach(([fieldName, field]) => {
      let fieldSchema: any;

      switch (field.type) {
        case 'string':
          fieldSchema = yup.string();
          if (field.minLength) fieldSchema = fieldSchema.min(field.minLength);
          if (field.maxLength) fieldSchema = fieldSchema.max(field.maxLength);
          if (field.pattern) fieldSchema = fieldSchema.matches(new RegExp(field.pattern));
          if (field.enum) fieldSchema = fieldSchema.oneOf(field.enum);
          break;
        case 'number':
          fieldSchema = yup.number();
          if (field.min !== undefined) fieldSchema = fieldSchema.min(field.min);
          if (field.max !== undefined) fieldSchema = fieldSchema.max(field.max);
          break;
        case 'boolean':
          fieldSchema = yup.boolean();
          break;
        case 'date':
          fieldSchema = yup.date();
          break;
        case 'array':
          fieldSchema = yup.array();
          break;
        default:
          fieldSchema = yup.mixed();
      }

      if (field.required) {
        fieldSchema = fieldSchema.required(`${fieldName} is required`);
      }

      schemaFields[fieldName] = fieldSchema;
    });

    return yup.object().shape({
      data: yup.object().shape(schemaFields)
    });
  };

  const validationSchema = createValidationSchema(fullSchema || schema);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      data: document || {}
    }
  });

  const watchedData = watch('data');

  // Validate document mutation
  const validateMutation = useMutation({
    mutationFn: (data: any) => DocumentVersioningService.validateDocument(collection, data),
    onSuccess: (result) => {
      setValidationErrors(result.errors);
      setValidationWarnings(result.warnings);
    }
  });

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: (versionId: string) => 
      DocumentVersioningService.restoreVersion(collection, document._id, versionId),
    onSuccess: (restoredData) => {
      reset({ data: restoredData });
      setJsonValue(JSON.stringify(restoredData, null, 2));
      queryClient.invalidateQueries({ queryKey: ['document-versions', collection, document._id] });
    }
  });

  useEffect(() => {
    if (open) {
      const initialData = document || {};
      reset({ data: initialData });
      setJsonValue(JSON.stringify(initialData, null, 2));
      setJsonError(null);
      setValidationErrors([]);
      setValidationWarnings([]);
      setSaveComment('');
    }
  }, [open, document, reset]);

  useEffect(() => {
    if (tabValue === 1) {
      // Update JSON when switching to JSON tab
      setJsonValue(JSON.stringify(watchedData, null, 2));
    }
  }, [tabValue, watchedData]);

  // Validate document when data changes
  useEffect(() => {
    if (watchedData && Object.keys(watchedData).length > 0) {
      validateMutation.mutate(watchedData);
    }
  }, [watchedData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0 && tabValue === 1) {
      // Switching from JSON to form - validate and update form data
      try {
        const parsedData = JSON.parse(jsonValue);
        setValue('data', parsedData);
        setJsonError(null);
      } catch (error) {
        setJsonError('Invalid JSON format');
        return;
      }
    }
    setTabValue(newValue);
  };

  const handleJsonChange = (value: string) => {
    setJsonValue(value);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const onSubmit = (formData: any) => {
    let dataToSave = formData.data;

    if (tabValue === 1) {
      // If on JSON tab, use JSON data
      try {
        dataToSave = JSON.parse(jsonValue);
      } catch (error) {
        setJsonError('Invalid JSON format');
        return;
      }
    }

    // Remove _id and __v for new documents
    if (isNew) {
      const { _id, __v, ...cleanData } = dataToSave;
      dataToSave = cleanData;
    }

    onSave(dataToSave, saveComment || undefined);
  };

  const handleRestoreVersion = (versionId: string) => {
    restoreVersionMutation.mutate(versionId);
  };

  const renderSchemaAwareField = (fieldName: string, field: SchemaField, value: any) => {
    const fieldPath = `data.${fieldName}`;
    
    // Handle enum fields
    if (field.enum && field.enum.length > 0) {
      return (
        <Controller
          key={fieldName}
          name={fieldPath}
          control={control}
          render={({ field: formField }) => (
            <FormControl fullWidth margin="normal">
              <InputLabel>{fieldName} {field.required && '*'}</InputLabel>
              <Select
                {...formField}
                label={`${fieldName} ${field.required ? '*' : ''}`}
              >
                {field.enum!.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      );
    }

    // Handle boolean fields with switch
    if (field.type === 'boolean') {
      return (
        <Controller
          key={fieldName}
          name={fieldPath}
          control={control}
          render={({ field: formField }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={!!formField.value}
                  onChange={(e) => formField.onChange(e.target.checked)}
                />
              }
              label={`${fieldName} ${field.required ? '*' : ''}`}
              sx={{ mt: 2, mb: 1 }}
            />
          )}
        />
      );
    }

    // Handle ObjectId references
    if (field.type === 'objectId' && field.ref) {
      return (
        <Controller
          key={fieldName}
          name={fieldPath}
          control={control}
          render={({ field: formField }) => (
            <TextField
              {...formField}
              label={`${fieldName} ${field.required ? '*' : ''}`}
              fullWidth
              margin="normal"
              helperText={`Reference to ${field.ref} collection`}
              InputProps={{
                endAdornment: (
                  <Tooltip title="Browse references">
                    <IconButton size="small">
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                )
              }}
            />
          )}
        />
      );
    }

    // Handle other field types with validation
    const getInputType = () => {
      switch (field.type) {
        case 'number': return 'number';
        case 'date': return 'datetime-local';
        default: return 'text';
      }
    };

    return (
      <Controller
        key={fieldName}
        name={fieldPath}
        control={control}
        render={({ field: formField, fieldState }) => (
          <TextField
            {...formField}
            label={`${fieldName} ${field.required ? '*' : ''}`}
            type={getInputType()}
            fullWidth
            margin="normal"
            multiline={field.type === 'string' && (field.maxLength || 0) > 100}
            rows={field.type === 'string' && (field.maxLength || 0) > 100 ? 3 : 1}
            error={!!fieldState.error}
            helperText={
              fieldState.error?.message || 
              (field.type === 'date' ? 'Date and time' : 
               field.minLength || field.maxLength ? 
               `Length: ${field.minLength || 0}-${field.maxLength || '∞'}` : '')
            }
            InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
            value={field.type === 'date' && formField.value ? 
              new Date(formField.value).toISOString().slice(0, 16) : 
              formField.value || ''}
            onChange={(e) => {
              if (field.type === 'number') {
                formField.onChange(Number(e.target.value));
              } else if (field.type === 'date') {
                formField.onChange(new Date(e.target.value).toISOString());
              } else {
                formField.onChange(e.target.value);
              }
            }}
          />
        )}
      />
    );
  };

  const renderFormFields = (data: any, path = '') => {
    if (!data || typeof data !== 'object') return null;

    return Object.entries(data).map(([key, value]) => {
      const fieldPath = path ? `${path}.${key}` : key;
      const fieldName = `data.${fieldPath}`;

      if (key === '_id' || key === '__v') {
        return (
          <Controller
            key={fieldPath}
            name={fieldName}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={key}
                fullWidth
                disabled
                margin="normal"
                helperText="System field (read-only)"
              />
            )}
          />
        );
      }

      if (typeof value === 'string') {
        return (
          <Controller
            key={fieldPath}
            name={fieldName}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={key}
                fullWidth
                margin="normal"
                multiline={value.length > 100}
                rows={value.length > 100 ? 3 : 1}
              />
            )}
          />
        );
      }

      if (typeof value === 'number') {
        return (
          <Controller
            key={fieldPath}
            name={fieldName}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={key}
                type="number"
                fullWidth
                margin="normal"
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
        );
      }

      if (typeof value === 'boolean') {
        return (
          <Controller
            key={fieldPath}
            name={fieldName}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={key}
                select
                fullWidth
                margin="normal"
                SelectProps={{
                  native: true,
                }}
                onChange={(e) => field.onChange(e.target.value === 'true')}
                value={field.value ? 'true' : 'false'}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </TextField>
            )}
          />
        );
      }

      if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))) {
        return (
          <Controller
            key={fieldPath}
            name={fieldName}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={key}
                type="datetime-local"
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
              />
            )}
          />
        );
      }

      // For objects and arrays, show as JSON
      return (
        <Controller
          key={fieldPath}
          name={fieldName}
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={key}
              fullWidth
              multiline
              rows={4}
              margin="normal"
              value={typeof field.value === 'object' ? JSON.stringify(field.value, null, 2) : field.value}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  field.onChange(parsed);
                } catch {
                  field.onChange(e.target.value);
                }
              }}
              helperText="JSON format"
            />
          )}
        />
      );
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        {isNew ? 'Create New Document' : 'Edit Document'}
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Validation Status */}
        {(validationErrors.length > 0 || validationWarnings.length > 0) && (
          <Box sx={{ mb: 2 }}>
            {validationErrors.length > 0 && (
              <Alert severity="error" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Validation Errors:</Typography>
                {validationErrors.map((error, index) => (
                  <Typography key={index} variant="body2">
                    • {error.field}: {error.message}
                  </Typography>
                ))}
              </Alert>
            )}
            {validationWarnings.length > 0 && (
              <Alert severity="warning">
                <Typography variant="subtitle2">Warnings:</Typography>
                {validationWarnings.map((warning, index) => (
                  <Typography key={index} variant="body2">
                    • {warning.field}: {warning.message}
                  </Typography>
                ))}
              </Alert>
            )}
          </Box>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Form Editor" />
            <Tab label="JSON Editor" />
            {!isNew && (
              <>
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon fontSize="small" />
                      Versions ({versions.length})
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RelationshipIcon fontSize="small" />
                      Relationships ({relationships.length})
                    </Box>
                  } 
                />
              </>
            )}
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box component="form" noValidate>
            {/* Schema-aware form fields */}
            {fullSchema?.fields && Object.keys(fullSchema.fields).length > 0 ? (
              Object.entries(fullSchema.fields).map(([fieldName, field]) => 
                renderSchemaAwareField(fieldName, field, watchedData?.[fieldName])
              )
            ) : (
              // Fallback to generic form rendering
              watchedData && renderFormFields(watchedData)
            )}
            
            {/* Save comment field */}
            {!isNew && (
              <TextField
                fullWidth
                label="Save Comment (Optional)"
                value={saveComment}
                onChange={(e) => setSaveComment(e.target.value)}
                margin="normal"
                helperText="Describe the changes you made"
                multiline
                rows={2}
              />
            )}

            {errors.data && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.data.message}
              </Alert>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Edit the document as JSON. Make sure the JSON is valid before saving.
            </Typography>
            <Paper variant="outlined" sx={{ p: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={20}
                value={jsonValue}
                onChange={(e) => handleJsonChange(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  },
                }}
                placeholder="Enter JSON document..."
              />
            </Paper>
            {jsonError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {jsonError}
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Version History Tab */}
        {!isNew && (
          <TabPanel value={tabValue} index={2}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Version History
              </Typography>
              {versions.length === 0 ? (
                <Typography color="text.secondary">
                  No version history available for this document.
                </Typography>
              ) : (
                <List>
                  {versions.map((version, index) => (
                    <React.Fragment key={version.id}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <Tooltip title="Compare with current">
                              <IconButton size="small">
                                <CompareIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Restore this version">
                              <IconButton 
                                size="small" 
                                onClick={() => handleRestoreVersion(version.id)}
                                disabled={restoreVersionMutation.isLoading}
                              >
                                <RestoreIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemIcon>
                          <HistoryIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Version ${version.version}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(version.createdAt).toLocaleString()} by {version.createdBy}
                              </Typography>
                              {version.comment && (
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  {version.comment}
                                </Typography>
                              )}
                              <Box sx={{ mt: 1 }}>
                                {version.changes.map((change, changeIndex) => (
                                  <Chip
                                    key={changeIndex}
                                    label={DocumentVersioningService.formatChangeDescription(change)}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                    color={
                                      change.operation === 'add' ? 'success' :
                                      change.operation === 'delete' ? 'error' : 'default'
                                    }
                                  />
                                ))}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < versions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </TabPanel>
        )}

        {/* Relationships Tab */}
        {!isNew && (
          <TabPanel value={tabValue} index={3}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Document Relationships
              </Typography>
              {relationships.length === 0 ? (
                <Typography color="text.secondary">
                  No relationships found for this document.
                </Typography>
              ) : (
                <Box>
                  {relationships.map((relationship, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <RelationshipIcon />
                          <Box>
                            <Typography variant="subtitle1">
                              {relationship.field} → {relationship.targetCollection}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {relationship.type} relationship
                            </Typography>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            <strong>Type:</strong> {relationship.type}<br />
                            <strong>Foreign Key:</strong> {relationship.foreignKey}<br />
                            <strong>Local Key:</strong> {relationship.localKey}
                          </Typography>
                          
                          {relationship.documents && relationship.documents.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Related Documents ({relationship.documents.length}):
                              </Typography>
                              <List dense>
                                {relationship.documents.slice(0, 5).map((relDoc, docIndex) => (
                                  <ListItem key={docIndex}>
                                    <ListItemText
                                      primary={DocumentRelationshipService.buildRelationshipGraph(
                                        relDoc, []
                                      ).nodes[0]?.label || relDoc._id}
                                      secondary={`ID: ${relDoc._id}`}
                                    />
                                  </ListItem>
                                ))}
                                {relationship.documents.length > 5 && (
                                  <ListItem>
                                    <ListItemText
                                      primary={`... and ${relationship.documents.length - 5} more`}
                                      secondary="Click to view all"
                                    />
                                  </ListItem>
                                )}
                              </List>
                            </Box>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </Box>
          </TabPanel>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit(onSubmit)} 
          variant="contained"
          disabled={loading || (tabValue === 1 && !!jsonError)}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentEditor;