import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { DatabaseService } from '../services/database';
import {
  CollectionBrowser,
  DataTable,
  QueryBuilder,
  CollectionStats,
  BackupRestore
} from '../components/database';
import type { CollectionMetadata } from '../types/api';

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
      id={`database-tabpanel-${index}`}
      aria-labelledby={`database-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const DatabasePage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedCollection, setSelectedCollection] = useState<CollectionMetadata | null>(null);

  const {
    data: collections = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['collections'],
    queryFn: DatabaseService.getCollections,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCollectionSelect = (collection: CollectionMetadata) => {
    setSelectedCollection(collection);
    // Switch to data table tab when a collection is selected
    if (tabValue === 0) {
      setTabValue(1);
    }
  };

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Database Management
        </Typography>
        <Alert severity="error">
          Failed to load database information: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Database Management
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Comprehensive database management with CRUD operations, query building, and analytics
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Collections" />
            <Tab label="Data Browser" disabled={!selectedCollection} />
            <Tab label="Query Builder" />
            <Tab label="Statistics" disabled={!selectedCollection} />
            <Tab label="Backup & Restore" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CollectionBrowser
            onCollectionSelect={handleCollectionSelect}
            selectedCollection={selectedCollection?.name}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {selectedCollection ? (
            <DataTable collection={selectedCollection} />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Select a collection to browse data
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <QueryBuilder 
            collections={collections}
            onResults={(results) => {
              // Could implement result handling here
              console.log('Query results:', results);
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {selectedCollection ? (
            <CollectionStats collection={selectedCollection} />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Select a collection to view statistics
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <BackupRestore collections={collections} />
        </TabPanel>
      </Paper>

      {/* Collection Info Bar */}
      {selectedCollection && (
        <Paper sx={{ mt: 2, p: 2, bgcolor: 'primary.50' }}>
          <Typography variant="body2">
            <strong>Selected Collection:</strong> {selectedCollection.name} • 
            <strong> Documents:</strong> {DatabaseService.formatCount(selectedCollection.count)} • 
            <strong> Size:</strong> {DatabaseService.formatSize(selectedCollection.size)} • 
            <strong> Indexes:</strong> {selectedCollection.indexes.length}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DatabasePage;
