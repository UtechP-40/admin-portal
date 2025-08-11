import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Menu,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem
} from '@mui/x-data-grid';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid/models';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatabaseService } from '../../services/database';
import type { CollectionMetadata } from '../../types/api';
import DocumentEditor from './DocumentEditor';
import BulkOperationsDialog from './BulkOperationsDialog';
import ExportDialog from './ExportDialog';

interface DataTableProps {
  collection: CollectionMetadata;
}

const DataTable: React.FC<DataTableProps> = ({ collection }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortModel, setSortModel] = useState<any[]>([]);
  const [filterModel, setFilterModel] = useState<any>({});
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  
  // Dialog states
  const [editDialog, setEditDialog] = useState<{ open: boolean; document?: any; isNew?: boolean }>({
    open: false
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; documentId?: string }>({
    open: false
  });
  const [bulkDialog, setBulkDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  
  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const queryClient = useQueryClient();

  // Build query options
  const queryOptions = useMemo(() => {
    const options: any = {
      page: page + 1,
      limit: pageSize
    };

    if (sortModel.length > 0) {
      const sort: any = {};
      sortModel.forEach(item => {
        sort[item.field] = item.sort === 'asc' ? 1 : -1;
      });
      options.sort = sort;
    }

    if (Object.keys(filterModel).length > 0) {
      options.filter = filterModel;
    }

    return options;
  }, [page, pageSize, sortModel, filterModel]);

  // Fetch documents
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['collection-documents', collection.name, queryOptions],
    queryFn: () => DatabaseService.getCollectionDocuments(collection.name, queryOptions),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (document: any) => DatabaseService.createDocument(collection.name, document),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-documents', collection.name] });
      setNotification({ open: true, message: 'Document created successfully', severity: 'success' });
      setEditDialog({ open: false });
    },
    onError: (error: any) => {
      setNotification({ 
        open: true, 
        message: `Failed to create document: ${error.message}`, 
        severity: 'error' 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      DatabaseService.updateDocument(collection.name, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-documents', collection.name] });
      setNotification({ open: true, message: 'Document updated successfully', severity: 'success' });
      setEditDialog({ open: false });
    },
    onError: (error: any) => {
      setNotification({ 
        open: true, 
        message: `Failed to update document: ${error.message}`, 
        severity: 'error' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DatabaseService.deleteDocument(collection.name, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-documents', collection.name] });
      setNotification({ open: true, message: 'Document deleted successfully', severity: 'success' });
      setDeleteDialog({ open: false });
    },
    onError: (error: any) => {
      setNotification({ 
        open: true, 
        message: `Failed to delete document: ${error.message}`, 
        severity: 'error' 
      });
    }
  });

  // Generate columns from schema and data
  const columns: GridColDef[] = useMemo(() => {
    if (!data?.documents?.length) return [];

    const sampleDoc = data.documents[0];
    const cols: GridColDef[] = [];

    // Add _id column first
    cols.push({
      field: '_id',
      headerName: 'ID',
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        </Tooltip>
      )
    });

    // Add other fields
    Object.keys(sampleDoc).forEach(key => {
      if (key === '_id' || key === '__v') return;

      const value = sampleDoc[key];
      let width = 150;
      let renderCell;

      if (typeof value === 'boolean') {
        width = 100;
        renderCell = (params: any) => (
          <Chip 
            label={params.value ? 'True' : 'False'} 
            color={params.value ? 'success' : 'default'}
            size="small"
          />
        );
      } else if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))) {
        width = 180;
        renderCell = (params: any) => {
          const date = new Date(params.value);
          return date.toLocaleString();
        };
      } else if (typeof value === 'object' && value !== null) {
        width = 200;
        renderCell = (params: any) => (
          <Tooltip title={JSON.stringify(params.value, null, 2)}>
            <Typography variant="body2" noWrap>
              {Array.isArray(params.value) ? `Array(${params.value.length})` : 'Object'}
            </Typography>
          </Tooltip>
        );
      } else if (typeof value === 'string' && value.length > 50) {
        width = 250;
        renderCell = (params: any) => (
          <Tooltip title={params.value}>
            <Typography variant="body2" noWrap>
              {params.value}
            </Typography>
          </Tooltip>
        );
      }

      cols.push({
        field: key,
        headerName: key.charAt(0).toUpperCase() + key.slice(1),
        width,
        renderCell
      });
    });

    // Add actions column
    cols.push({
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => setEditDialog({ open: true, document: params.row })}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => setDeleteDialog({ open: true, documentId: params.row._id })}
        />
      ]
    });

    return cols;
  }, [data?.documents]);

  const handleEdit = (document?: any) => {
    setEditDialog({ open: true, document, isNew: !document });
  };

  const handleSave = (documentData: any) => {
    if (editDialog.isNew) {
      createMutation.mutate(documentData);
    } else {
      updateMutation.mutate({ id: editDialog.document._id, data: documentData });
    }
  };

  const handleDelete = () => {
    if (deleteDialog.documentId) {
      deleteMutation.mutate(deleteDialog.documentId);
    }
  };

  const handleExport = async (format: 'json' | 'csv' | 'xlsx', options: any) => {
    try {
      const blob = await DatabaseService.exportCollection(collection.name, {
        format,
        ...options
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collection.name}_export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setNotification({ open: true, message: 'Export completed successfully', severity: 'success' });
    } catch (error: any) {
      setNotification({ 
        open: true, 
        message: `Export failed: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  if (error) {
    return (
      <Alert severity="error">
        Failed to load documents: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {collection.name} ({DatabaseService.formatCount(collection.count)} documents)
        </Typography>
        
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => handleEdit()}
          sx={{ mr: 1 }}
        >
          Add Document
        </Button>
        
        <IconButton onClick={() => refetch()}>
          <RefreshIcon />
        </IconButton>
        
        <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
          <MoreIcon />
        </IconButton>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={data?.documents || []}
          columns={columns}
          loading={isLoading}
          pagination
          paginationMode="server"
          rowCount={data?.pagination?.total || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          filterMode="server"
          onFilterModelChange={setFilterModel}
          checkboxSelection
          onRowSelectionModelChange={setSelectedRows}
          components={{
            Toolbar: GridToolbar,
          }}
          getRowId={(row) => row._id}
          sx={{
            '& .MuiDataGrid-cell': {
              borderRight: '1px solid rgba(224, 224, 224, 1)',
            },
          }}
        />
      </Paper>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setExportDialog(true); setMenuAnchor(null); }}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export Data
        </MenuItem>
        <MenuItem onClick={() => { setBulkDialog(true); setMenuAnchor(null); }}>
          <UploadIcon sx={{ mr: 1 }} />
          Bulk Operations
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <DocumentEditor
        open={editDialog.open}
        document={editDialog.document}
        isNew={editDialog.isNew}
        schema={collection.schema}
        onSave={handleSave}
        onClose={() => setEditDialog({ open: false })}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this document? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false })}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Operations Dialog */}
      <BulkOperationsDialog
        open={bulkDialog}
        onClose={() => setBulkDialog(false)}
        collection={collection}
        selectedRows={selectedRows}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['collection-documents', collection.name] });
          setNotification({ open: true, message: 'Bulk operation completed', severity: 'success' });
        }}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialog}
        onClose={() => setExportDialog(false)}
        onExport={handleExport}
      />

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DataTable;