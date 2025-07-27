import React from 'react';
import { Card, CardContent, Typography, Box, Chip, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  loading?: boolean;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color,
  loading = false,
  subtitle
}) => {
  const theme = useTheme();
  
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp fontSize="small" />;
    if (change < 0) return <TrendingDown fontSize="small" />;
    return <TrendingFlat fontSize="small" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return theme.palette.text.secondary;
    if (change > 0) return theme.palette.success.main;
    if (change < 0) return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  const formatChange = () => {
    if (change === undefined) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            {icon && (
              <Box sx={{ color: color || theme.palette.primary.main }}>
                {icon}
              </Box>
            )}
          </Box>
          
          <Typography variant="h4" component="div" gutterBottom>
            {loading ? '...' : value}
          </Typography>
          
          {subtitle && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {subtitle}
            </Typography>
          )}
          
          {change !== undefined && (
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                icon={getTrendIcon()}
                label={formatChange()}
                size="small"
                sx={{
                  backgroundColor: getTrendColor() + '20',
                  color: getTrendColor(),
                  '& .MuiChip-icon': {
                    color: getTrendColor(),
                  },
                }}
              />
              {changeLabel && (
                <Typography variant="body2" color="text.secondary">
                  {changeLabel}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetricCard;