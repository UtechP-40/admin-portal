import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Grid,
} from '@mui/material';
import { motion } from 'framer-motion';

// Table loading skeleton
export const TableLoadingSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <Box>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 1 }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="rectangular"
            height={40}
            sx={{ flex: 1, borderRadius: 1 }}
          />
        ))}
      </Box>
    ))}
  </Box>
);

// Card loading skeleton
export const CardLoadingSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <Grid container spacing={3}>
    {Array.from({ length: count }).map((_, index) => (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
            <Skeleton variant="rectangular" height={100} sx={{ mt: 2, borderRadius: 1 }} />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// Chart loading skeleton
export const ChartLoadingSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Skeleton variant="text" width="20%" height={16} />
        <Skeleton variant="text" width="20%" height={16} />
        <Skeleton variant="text" width="20%" height={16} />
      </Box>
    </CardContent>
  </Card>
);

// Form loading skeleton
export const FormLoadingSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <Box>
    {Array.from({ length: fields }).map((_, index) => (
      <Box key={index} sx={{ mb: 3 }}>
        <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
      </Box>
    ))}
    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
      <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
      <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
    </Box>
  </Box>
);

// List loading skeleton
export const ListLoadingSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <Box>
    {Array.from({ length: items }).map((_, index) => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
      </Box>
    ))}
  </Box>
);

// Dashboard loading skeleton
export const DashboardLoadingSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Box sx={{ mb: 4 }}>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" height={20} />
    </Box>
    
    {/* Stats Cards */}
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Skeleton variant="text" width={80} height={16} />
                  <Skeleton variant="text" width={60} height={32} sx={{ mt: 1 }} />
                </Box>
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>

    {/* Charts */}
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <ChartLoadingSkeleton height={400} />
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="50%" height={24} sx={{ mb: 2 }} />
            <ListLoadingSkeleton items={6} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </motion.div>
);

// Page loading skeleton with header
export const PageLoadingSkeleton: React.FC<{ 
  title?: boolean;
  breadcrumbs?: boolean;
  content?: 'table' | 'cards' | 'form' | 'dashboard' | 'list';
}> = ({ 
  title = true, 
  breadcrumbs = true, 
  content = 'table' 
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    {breadcrumbs && (
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="text" width="30%" height={16} />
      </Box>
    )}
    
    {title && (
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={20} />
      </Box>
    )}

    {content === 'table' && <TableLoadingSkeleton />}
    {content === 'cards' && <CardLoadingSkeleton />}
    {content === 'form' && <FormLoadingSkeleton />}
    {content === 'dashboard' && <DashboardLoadingSkeleton />}
    {content === 'list' && <ListLoadingSkeleton />}
  </motion.div>
);

export default {
  TableLoadingSkeleton,
  CardLoadingSkeleton,
  ChartLoadingSkeleton,
  FormLoadingSkeleton,
  ListLoadingSkeleton,
  DashboardLoadingSkeleton,
  PageLoadingSkeleton,
};