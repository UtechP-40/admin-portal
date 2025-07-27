import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import {
  CloudDownload as BackupIcon,
  CloudUpload as RestoreIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { DatabaseService } from '../../services/database';
import type { CollectionMetadata, RestoreResult } from '../../types/api';

interface BackupRestoreProps {
  collections: CollectionMetadata[];
}

const BackupRestore: React.FC<BackupRestoreProps> = ({ collections }) => {
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'backup' | 'restore';
    details?: any;
  }>({ open: false, type: 'backup' });
  const [restoreResults, setRestoreResults] = useState<RestoreResult | null>(null);

  const backupMutation = useMutation({
    mutationFn: (collections?: string[]) => DatabaseService.createBackup(collections),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setConfirmDialog({ open: false, type: 'backup' });
    }
  });

  const restoreMutation = useMutation({
    mutationFn: ({ file, overwrite }: { file: File; overwrite: boolean }) =>
      DatabaseService.restoreBackup(file, overwrite),
    onSuccess: (results) => {
      setRestoreResults(results);
      setConfirmDialog({ open: false, type: 'restore' });
      setRestoreFile(null);
    }
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedCollections(collections.map(c => c.name));
    } else {
      setSelectedCollections([]);
    }
  };

  const handleCollectionToggle = (collectionName: string) => {
    const isSelected = selectedCollections.includes(collectionName);
    if (isSelected) {
      setSelectedCollections(selectedCollections.filter(name => name !== collectionName));
    } else {
      setSelectedCollections([...selectedCollections, collectionName]);
    }
  };

  const handleBackup = () => {
    const collectionsToBackup = selectedCollections.length > 0 ? selectedCollections : undefined;
    setConfirmDialog({
      open: true,
      type: 'backup',
      details: {
        collections: collectionsToBackup || collections.map(c => c.name),
        totalDocuments: collectionsToBackup
          ? collections
              .filter(c => collectionsToBackup.includes(c.name))
              .reduce((sum, c) => sum + c.count, 0)
          : collections.reduce((sum, c) => sum + c.count, 0)
      }
    });
  };

  const handleRestore = () => {
    if (!restoreFile) return;
    
    setConfirmDialog({
      open: true,
      type: 'restore',
      details: {
        filename: restoreFile.name,
        size: DatabaseService.formatSize(restoreFile.size),
        overwrite
      }
    });
  };

  const confirmBackup = () => {
    const collectionsToBackup = selectedCollections.length > 0 ? selectedCollections : undefined;
    backupMutation.mutate(collectionsToBackup);
  };

  const confirmRestore = () => {
    if (restoreFile) {
      restoreMutation.mutate({ file: restoreFile, overwrite });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setRestoreFile(file);
      } else {
        alert('Please select a JSON backup file');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Backup & Restore
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Backup Section */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BackupIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Create Backup</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a backup of your database collections. You can select specific collections 
            or backup all collections.
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            }
            label="Select All Collections"
            sx={{ mb: 2 }}
          />

          <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
            {collections.map((collection) => (
              <FormControlLabel
                key={collection.name}
                control={
                  <Checkbox
                    checked={selectedCollections.includes(collection.name)}
                    onChange={() => handleCollectionToggle(collection.name)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">
                      {collection.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {DatabaseService.formatCount(collection.count)} documents, {DatabaseService.formatSize(collection.size)}
                    </Typography>
                  </Box>
                }
                sx={{ display: 'block', mb: 1 }}
              />
            ))}
          </Box>

          <Button
            variant="contained"
            startIcon={<BackupIcon />}
            onClick={handleBackup}
            disabled={backupMutation.isLoading}
            fullWidth
          >
            {backupMutation.isLoading ? 'Creating Backup...' : 'Create Backup'}
          </Button>

          {backupMutation.isLoading && <LinearProgress sx={{ mt: 2 }} />}

          {backupMutation.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Backup failed: {backupMutation.error instanceof Error ? backupMutation.error.message : 'Unknown error'}
            </Alert>
          )}
        </Paper>

        {/* Restore Section */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <RestoreIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Restore Backup</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Restore your database from a backup file. This will import data from the backup 
            into your collections.
          </Typography>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Restoring a backup will add data to your existing collections. 
              Enable "Overwrite existing data" to replace all existing data.
            </Typography>
          </Alert>

          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mb: 2 }}
          >
            Select Backup File
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              hidden
            />
          </Button>

          {restoreFile && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Selected File:</strong> {restoreFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Size: {DatabaseService.formatSize(restoreFile.size)}
              </Typography>
            </Box>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
              />
            }
            label="Overwrite existing data"
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            startIcon={<RestoreIcon />}
            onClick={handleRestore}
            disabled={!restoreFile || restoreMutation.isLoading}
            fullWidth
            color={overwrite ? 'error' : 'primary'}
          >
            {restoreMutation.isLoading ? 'Restoring...' : 'Restore Backup'}
          </Button>

          {restoreMutation.isLoading && <LinearProgress sx={{ mt: 2 }} />}

          {restoreMutation.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Restore failed: {restoreMutation.error instanceof Error ? restoreMutation.error.message : 'Unknown error'}
            </Alert>
          )}

          {restoreResults && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Restore completed successfully!
              </Typography>
              <List dense>
                {Object.entries(restoreResults).map(([collection, result]) => (
                  <ListItem key={collection} sx={{ py: 0 }}>
                    <ListItemText
                      primary={collection}
                      secondary={`${result.inserted} inserted, ${result.skipped} skipped`}
                    />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}
        </Paper>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: 'backup' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            Confirm {confirmDialog.type === 'backup' ? 'Backup' : 'Restore'}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {confirmDialog.type === 'backup' && confirmDialog.details && (
            <Box>
              <Typography gutterBottom>
                You are about to create a backup with the following details:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Collections"
                    secondary={`${confirmDialog.details.collections.length} collections`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Total Documents"
                    secondary={DatabaseService.formatCount(confirmDialog.details.totalDocuments)}
                  />
                </ListItem>
              </List>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Collections to backup:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {confirmDialog.details.collections.map((name: string) => (
                  <Chip key={name} label={name} size="small" />
                ))}
              </Box>
            </Box>
          )}

          {confirmDialog.type === 'restore' && confirmDialog.details && (
            <Box>
              <Typography gutterBottom>
                You are about to restore from the following backup:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="File"
                    secondary={confirmDialog.details.filename}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Size"
                    secondary={confirmDialog.details.size}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Overwrite Mode"
                    secondary={
                      <Chip
                        label={confirmDialog.details.overwrite ? 'Enabled' : 'Disabled'}
                        color={confirmDialog.details.overwrite ? 'error' : 'default'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
              </List>
              
              {confirmDialog.details.overwrite && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <strong>Warning:</strong> This will permanently delete all existing data 
                  in the collections being restored. This action cannot be undone.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, type: 'backup' })}
            disabled={backupMutation.isLoading || restoreMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDialog.type === 'backup' ? confirmBackup : confirmRestore}
            variant="contained"
            color={confirmDialog.type === 'restore' && overwrite ? 'error' : 'primary'}
            disabled={backupMutation.isLoading || restoreMutation.isLoading}
          >
            {confirmDialog.type === 'backup' ? 'Create Backup' : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BackupRestore;