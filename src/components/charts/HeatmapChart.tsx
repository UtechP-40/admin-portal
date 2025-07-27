import React from 'react';
import { Box, Typography, useTheme, Tooltip } from '@mui/material';

interface HeatmapData {
  x: string | number;
  y: string | number;
  value: number;
  label?: string;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  title?: string;
  width?: number;
  height?: number;
  cellSize?: number;
  colorScale?: [string, string];
  showLabels?: boolean;
  formatTooltip?: (data: HeatmapData) => string;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  title,
  width = 600,
  height = 400,
  cellSize = 20,
  colorScale,
  showLabels = false,
  formatTooltip
}) => {
  const theme = useTheme();
  
  const defaultColorScale: [string, string] = [
    theme.palette.grey[200],
    theme.palette.primary.main
  ];
  
  const colors = colorScale || defaultColorScale;
  
  // Get unique x and y values
  const xValues = Array.from(new Set(data.map(d => d.x))).sort();
  const yValues = Array.from(new Set(data.map(d => d.y))).sort();
  
  // Get min and max values for color scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  const getColor = (value: number) => {
    if (maxValue === minValue) return colors[0];
    const ratio = (value - minValue) / (maxValue - minValue);
    
    // Simple linear interpolation between two colors
    const r1 = parseInt(colors[0].slice(1, 3), 16);
    const g1 = parseInt(colors[0].slice(3, 5), 16);
    const b1 = parseInt(colors[0].slice(5, 7), 16);
    
    const r2 = parseInt(colors[1].slice(1, 3), 16);
    const g2 = parseInt(colors[1].slice(3, 5), 16);
    const b2 = parseInt(colors[1].slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const getCellData = (x: string | number, y: string | number) => {
    return data.find(d => d.x === x && d.y === y);
  };

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={{ overflow: 'auto' }}>
        <svg width={width} height={height}>
          {yValues.map((y, yIndex) =>
            xValues.map((x, xIndex) => {
              const cellData = getCellData(x, y);
              const value = cellData?.value || 0;
              const color = getColor(value);
              
              return (
                <Tooltip
                  key={`${x}-${y}`}
                  title={formatTooltip ? formatTooltip(cellData || { x, y, value }) : `${x}, ${y}: ${value}`}
                >
                  <g>
                    <rect
                      x={xIndex * cellSize + 50}
                      y={yIndex * cellSize + 30}
                      width={cellSize}
                      height={cellSize}
                      fill={color}
                      stroke={theme.palette.divider}
                      strokeWidth={0.5}
                      style={{ cursor: 'pointer' }}
                    />
                    {showLabels && (
                      <text
                        x={xIndex * cellSize + 50 + cellSize / 2}
                        y={yIndex * cellSize + 30 + cellSize / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="10"
                        fill={theme.palette.text.primary}
                      >
                        {value}
                      </text>
                    )}
                  </g>
                </Tooltip>
              );
            })
          )}
          
          {/* X-axis labels */}
          {xValues.map((x, index) => (
            <text
              key={`x-${x}`}
              x={index * cellSize + 50 + cellSize / 2}
              y={20}
              textAnchor="middle"
              fontSize="12"
              fill={theme.palette.text.secondary}
            >
              {x}
            </text>
          ))}
          
          {/* Y-axis labels */}
          {yValues.map((y, index) => (
            <text
              key={`y-${y}`}
              x={40}
              y={index * cellSize + 30 + cellSize / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="12"
              fill={theme.palette.text.secondary}
            >
              {y}
            </text>
          ))}
        </svg>
      </Box>
    </Box>
  );
};

export default HeatmapChart;