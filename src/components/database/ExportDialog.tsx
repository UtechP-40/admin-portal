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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: 'json' | 'csv' | 'xlsx', options: any) => Promise<void>;
}

interface ExportFormData {
  format: 'json' | 'csv' | 'xlsx';
  limit: number;
  filter: string;
  select: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  onExport
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<ExportFormData>({
    defaultValues: {
      format: 'json',
      limit: 10000,
      filter: '{}',
      select: ''
    }
  });

  const watchedFormat = watch('format');

  const onSubmit = async (data: ExportFormData) => {
    setIsExporting(true);
    setError(null);

    try {
      const options: any = {
        limit: data.limit
      };

      // Parse filter if provided
      if (data.filter && data.filter.trim() !== '{}') {
        try {
          options.filter = JSON.parse(data.filter);
        } catch (err) {
          throw new Error('Invalid filter JSON format');
        }
      }

      // Add select if provided
      if (data.select && data.select.trim()) {
        options.select = data.select;
      }

      await onExport(data.format, options);
      onClose();
      reset();
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
      reset();
      setError(null);
    }
  };

  const formatDescriptions = {
    json: 'Export as JSON file with full document structure and data types preserved',
    csv: 'Export as CSV file (flattened structure, suitable for spreadsheet applications)',
    xlsx: 'Export as Excel file with formatted columns and data types'
  };

  const formatLimitations = {
    json: 'No limitations - preserves all data types and nested structures',
    csv: 'Complex objects will be stringified. Arrays will be comma-separated',
    xlsx: 'Complex objects will be stringified. Limited to Excel row/column limits'
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Export Collection Data</DialogTitle>
      
      <DialogContent dividers>
        <Box component="form" noValidate>
          <Controller
            name="format"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth margin="normal">
                <InputLabel>Export Format</InputLabel>
                <Select {...field} label="Export Format">
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Format Description:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {formatDescriptions[watchedFormat]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Limitations:</strong> {formatLimitations[watchedFormat]}
            </Typography>
          </Paper>

          <Controller
            name="limit"
            control={control}
            rules={{
              required: 'Limit is required',
              min: { value: 1, message: 'Limit must be at least 1' },
              max: { value: 50000, message: 'Limit cannot exceed 50,000' }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Document Limit"
                type="number"
                fullWidth
                margin="normal"
                error={!!errors.limit}
                helperText={errors.limit?.message || 'Maximum number of documents to export (1-50,000)'}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />

          <Controller
            name="filter"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Filter Query (JSON)"
                fullWidth
                multiline
                rows={4}
                margin="normal"
                placeholder='{"status": "active", "createdAt": {"$gte": "2024-01-01"}}'
                helperText="MongoDB filter query in JSON format. Leave as {} to export all documents."
              />
            )}
          />

          <Controller
            name="select"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Select Fields (Optional)"
                fullWidth
                margin="normal"
                placeholder="name email status createdAt"
                helperText="Space-separated field names to include. Leave empty to export all fields."
              />
            )}
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Export Tips:</strong>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label="Use filters to reduce file size" 
                size="small" 
                variant="outlined" 
              />
              <Chip 
                label="Select specific fields for faster export" 
                size="small" 
                variant="outlined" 
              />
              <Chip 
                label="JSON preserves data types" 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit(onSubmit)} 
          variant="contained"
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;