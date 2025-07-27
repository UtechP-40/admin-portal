import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  List as IndexIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { DatabaseService } from '../../services/database';
import type { CollectionMetadata } from '../../types/api';

interface CollectionStatsProps {
  collection: CollectionMetadata;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CollectionStats: React.FC<CollectionStatsProps> = ({ collection }) => {
  const {
    data: stats,
    isLoading,
    error
  } = useQuery({
    queryKey: ['collection-stats', collection.name],
    queryFn: () => DatabaseService.getCollectionStats(collection.name),
    enabled: !!collection.name
  });

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Collection Statistics
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load statistics: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  // Prepare data for charts
  const sizeData = [
    { name: 'Data Size', value: stats.stats.size, color: COLORS[0] },
    { name: 'Index Size', value: stats.stats.totalIndexSize, color: COLORS[1] }
  ];

  const indexData = stats.indexes.map((index, i) => ({
    name: index.name,
    size: index.size,
    color: COLORS[i % COLORS.length]
  }));

  const formatBytes = (bytes: number) => DatabaseService.formatSize(bytes);
  const formatCount = (count: number) => DatabaseService.formatCount(count);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {collection.name} - Statistics
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StorageIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {formatCount(stats.stats.count)}
                  </Typography>
                  <Typography color="text.secondary">
                    Documents
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {formatBytes(stats.stats.size)}
                  </Typography>
                  <Typography color="text.secondary">
                    Data Size
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SpeedIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {formatBytes(stats.stats.avgObjSize)}
                  </Typography>
                  <Typography color="text.secondary">
                    Avg Doc Size
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IndexIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {stats.indexes.length}
                  </Typography>
                  <Typography color="text.secondary">
                    Indexes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Storage Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sizeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatBytes(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sizeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatBytes(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Index Sizes
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={indexData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={formatBytes} />
                <Tooltip formatter={(value: number) => formatBytes(value)} />
                <Bar dataKey="size" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Information */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Storage Details
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Total Size"
                  secondary={formatBytes(stats.stats.size)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Storage Size"
                  secondary={formatBytes(stats.stats.storageSize)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Index Size"
                  secondary={formatBytes(stats.stats.totalIndexSize)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Average Document Size"
                  secondary={formatBytes(stats.stats.avgObjSize)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Document Count"
                  secondary={formatCount(stats.stats.count)}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Indexes
            </Typography>
            <List>
              {stats.indexes.map((index, i) => (
                <ListItem key={index.name}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {index.name}
                        </Typography>
                        <Chip 
                          label={formatBytes(index.size)} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                        {JSON.stringify(index.spec, null, 2)}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Schema Information */}
      {stats.schema && (
        <Paper sx={{ mt: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Schema Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Fields
                  </Typography>
                  <List dense>
                    {Object.entries(stats.schema.fields || {}).map(([fieldName, fieldInfo]: [string, any]) => (
                      <ListItem key={fieldName}>
                        <ListItemText
                          primary={fieldName}
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip label={fieldInfo.type} size="small" />
                              {fieldInfo.required && (
                                <Chip label="Required" size="small" color="error" />
                              )}
                              {fieldInfo.enum && (
                                <Chip label="Enum" size="small" color="info" />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Virtual Fields
                  </Typography>
                  <List dense>
                    {(stats.schema.virtuals || []).map((virtual: string) => (
                      <ListItem key={virtual}>
                        <ListItemText
                          primary={virtual}
                          secondary="Virtual field"
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}

      {/* Sample Document */}
      {stats.sampleDocument && (
        <Paper sx={{ mt: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Sample Document</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                component="pre"
                sx={{
                  backgroundColor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
              >
                {JSON.stringify(stats.sampleDocument, null, 2)}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}
    </Box>
  );
};

export default CollectionStats;