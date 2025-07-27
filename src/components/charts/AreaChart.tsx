import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

interface AreaChartProps {
  data: any[];
  title?: string;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  formatTooltip?: (value: any, name: string) => [string, string];
}

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  title,
  xKey,
  yKey,
  color,
  height = 300,
  showGrid = true,
  showLegend = true,
  stacked = false,
  formatTooltip
}) => {
  const theme = useTheme();
  const areaColor = color || theme.palette.primary.main;

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={xKey} 
            tick={{ fontSize: 12 }}
            stroke={theme.palette.text.secondary}
          />
          <YAxis 
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
          <Area 
            type="monotone" 
            dataKey={yKey} 
            stroke={areaColor}
            fill={areaColor}
            fillOpacity={0.3}
            strokeWidth={2}
            stackId={stacked ? "1" : undefined}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default AreaChart;