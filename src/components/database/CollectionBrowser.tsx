import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Storage as StorageIcon,
  TableChart as TableIcon,
  Refresh as RefreshIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DatabaseService } from '../../services/database';
import type { CollectionMetadata } from '../../types/api';

interface CollectionBrowserProps {
  onCollectionSelect: (collection: CollectionMetadata) => void;
  selectedCollection?: string;
}

const CollectionBrowser: React.FC<CollectionBrowserProps> = ({
  onCollectionSelect,
  selectedCollection
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: collections = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['collections'],
    queryFn: DatabaseService.getCollections,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load collections: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Database Collections
        </Typography>
        <Tooltip title="Refresh collections">
          <IconButton onClick={handleRefresh} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <TextField
        fullWidth
        placeholder="Search collections..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2}>
        {filteredCollections.map((collection) => (
          <Grid item xs={12} sm={6} md={4} key={collection.name}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedCollection === collection.name ? 2 : 1,
                borderColor: selectedCollection === collection.name ? 'primary.main' : 'divider',
                '&:hover': {
                  boxShadow: 3,
                  borderColor: 'primary.main',
                },
                transition: 'all 0.2s ease-in-out',
              }}
              onClick={() => onCollectionSelect(collection)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StorageIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div" noWrap>
                    {collection.name}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TableIcon sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2" color="text.secondary">
                    {DatabaseService.formatCount(collection.count)} documents
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StatsIcon sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2" color="text.secondary">
                    {DatabaseService.formatSize(collection.size)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    label={`${collection.indexes.length} indexes`}
                    size="small"
                    variant="outlined"
                  />
                  {collection.avgObjSize > 0 && (
                    <Chip
                      label={`Avg: ${DatabaseService.formatSize(collection.avgObjSize)}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredCollections.length === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {searchTerm ? 'No collections match your search' : 'No collections found'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CollectionBrowser;