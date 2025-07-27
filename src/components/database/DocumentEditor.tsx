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
  Paper
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

interface DocumentEditorProps {
  open: boolean;
  document?: any;
  isNew?: boolean;
  schema?: any;
  onSave: (data: any) => void;
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
  schema,
  onSave,
  onClose,
  loading = false
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonValue, setJsonValue] = useState('');

  // Create validation schema
  const validationSchema = yup.object().shape({
    data: yup.mixed().required('Document data is required')
  });

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

  useEffect(() => {
    if (open) {
      const initialData = document || {};
      reset({ data: initialData });
      setJsonValue(JSON.stringify(initialData, null, 2));
      setJsonError(null);
    }
  }, [open, document, reset]);

  useEffect(() => {
    if (tabValue === 1) {
      // Update JSON when switching to JSON tab
      setJsonValue(JSON.stringify(watchedData, null, 2));
    }
  }, [tabValue, watchedData]);

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

    onSave(dataToSave);
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Form Editor" />
            <Tab label="JSON Editor" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box component="form" noValidate>
            {watchedData && renderFormFields(watchedData)}
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