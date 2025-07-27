import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

interface BarChartProps {
  data: any[];
  title?: string;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
  formatTooltip?: (value: any, name: string) => [string, string];
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  xKey,
  yKey,
  color,
  height = 300,
  showGrid = true,
  showLegend = true,
  horizontal = false,
  formatTooltip
}) => {
  const theme = useTheme();
  const barColor = color || theme.palette.primary.main;

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart 
          data={data} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={horizontal ? 'horizontal' : 'vertical'}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={horizontal ? yKey : xKey}
            type={horizontal ? 'number' : 'category'}
            tick={{ fontSize: 12 }}
            stroke={theme.palette.text.secondary}
          />
          <YAxis 
            dataKey={horizontal ? xKey : yKey}
            type={horizontal ? 'category' : 'number'}
            tick={{ fontSize: 12 }}
            stroke={theme.palette.text.secondary}
          />
          <Tooltip 
            formatter={formatTooltip}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
            }}
          />
          {showLegend && <Legend />}
          <Bar 
            dataKey={horizontal ? xKey : yKey} 
            fill={barColor}
            radius={[2, 2, 0, 0]}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default BarChart;