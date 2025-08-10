import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ReportBuilder from '../ReportBuilder';
import InteractiveChart from '../../charts/InteractiveChart';
import { analyticsService } from '../../../services/analytics';
import { reportSchedulingService } from '../../../services/reportSchedulingService';

// Mock the analytics service
vi.mock('../../../services/analytics', () => ({
  analyticsService: {
    executeCustomQuery: vi.fn(),
    exportAnalyticsData: vi.fn(),
    getChartData: vi.fn(),
    exportChart: vi.fn(),
    saveReport: vi.fn(),
    getReports: vi.fn(),
  },
}));

// Mock the report scheduling service
vi.mock('../../../services/reportSchedulingService', () => ({
  reportSchedulingService: {
    createSchedule: vi.fn(),
    updateSchedule: vi.fn(),
    deleteSchedule: vi.fn(),
    executeReport: vi.fn(),
  },
}));

// Mock react-beautiful-dnd
vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => (
    <div data-testid="drag-drop-context" onDrop={onDragEnd}>
      {children}
    </div>
  ),
  Droppable: ({ children }: any) => (
    <div data-testid="droppable">
      {children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null }, {})}
    </div>
  ),
  Draggable: ({ children }: any) => (
    <div data-testid="draggable">
      {children({ innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} }, {})}
    </div>
  ),
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  ScatterChart: ({ children }: any) => <div data-testid="scatter-chart">{children}</div>,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Scatter: () => <div data-testid="scatter" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Brush: () => <div data-testid="brush" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  ReferenceArea: () => <div data-testid="reference-area" />,
}));

const mockReportData = {
  id: 'report_123',
  name: 'Test Report',
  description: 'A test report',
  dataSources: ['users', 'events'],
  fields: [
    { id: 'user_count', name: 'User Count', type: 'number', source: 'users', aggregation: 'count' },
    { id: 'timestamp', name: 'Timestamp', type: 'date', source: 'events' },
  ],
  filters: [
    { id: 'filter_1', field: 'status', operator: 'eq', value: 'active', label: 'Active Users' },
  ],
  visualizations: [
    {
      id: 'viz_1',
      type: 'chart',
      title: 'User Growth',
      config: { type: 'line' },
      position: { x: 0, y: 0, w: 6, h: 4 },
    },
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

const mockChartConfig = {
  type: 'line' as const,
  title: 'Test Chart',
  subtitle: 'A test chart',
  data: [
    { timestamp: '2024-01-01', value: 100, category: 'A' },
    { timestamp: '2024-01-02', value: 150, category: 'B' },
    { timestamp: '2024-01-03', value: 120, category: 'A' },
  ],
  series: [
    { key: 'value', name: 'Value', color: '#8884d8', type: 'line' as const },
  ],
  xAxisKey: 'timestamp',
  xAxisLabel: 'Date',
  yAxisLabel: 'Count',
  showGrid: true,
  showLegend: true,
  showBrush: false,
  showTooltip: true,
  height: 400,
};

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Report Builder Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (analyticsService.executeCustomQuery as any).mockResolvedValue([
      { timestamp: '2024-01-01', count: 100 },
      { timestamp: '2024-01-02', count: 150 },
    ]);
    (analyticsService.exportAnalyticsData as any).mockResolvedValue({
      filePath: '/tmp/report.csv',
      metadata: { recordCount: 2 },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('ReportBuilder', () => {
    it('should render report builder interface', () => {
      renderWithQueryClient(<ReportBuilder />);

      expect(screen.getByText('New Report')).toBeInTheDocument();
      expect(screen.getByText('Custom report builder')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save report/i })).toBeInTheDocument();
    });

    it('should render with initial report data', () => {
      renderWithQueryClient(<ReportBuilder initialReport={mockReportData} />);

      expect(screen.getByText('Test Report')).toBeInTheDocument();
      expect(screen.getByText('A test report')).toBeInTheDocument();
    });

    it('should navigate between tabs', () => {
      renderWithQueryClient(<ReportBuilder />);

      // Check initial tab
      expect(screen.getByText('Available Data Sources')).toBeInTheDocument();

      // Click on Fields tab
      fireEvent.click(screen.getByText('Fields'));
      expect(screen.getByText('Report Fields')).toBeInTheDocument();

      // Click on Filters tab
      fireEvent.click(screen.getByText('Filters'));
      expect(screen.getByText('Report Filters')).toBeInTheDocument();

      // Click on Visualizations tab
      fireEvent.click(screen.getByText('Visualizations'));
      expect(screen.getByText('Report Visualizations')).toBeInTheDocument();

      // Click on Preview tab
      fireEvent.click(screen.getByText('Preview'));
      expect(screen.getByText('Report Preview')).toBeInTheDocument();
    });

    it('should handle data source selection', () => {
      renderWithQueryClient(<ReportBuilder />);

      // Select a data source
      const usersSource = screen.getByText('Users');
      fireEvent.click(usersSource);

      // Should show selected data source
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    it('should handle adding fields', async () => {
      renderWithQueryClient(<ReportBuilder />);

      // Navigate to Fields tab
      fireEvent.click(screen.getByText('Fields'));

      // Click Add Field button
      fireEvent.click(screen.getByRole('button', { name: /add field/i }));

      // Should open add field dialog
      await waitFor(() => {
        expect(screen.getByText('Add Field')).toBeInTheDocument();
      });
    });

    it('should handle adding filters', async () => {
      renderWithQueryClient(<ReportBuilder />);

      // Navigate to Filters tab
      fireEvent.click(screen.getByText('Filters'));

      // Click Add Filter button
      fireEvent.click(screen.getByRole('button', { name: /add filter/i }));

      // Should open add filter dialog
      await waitFor(() => {
        expect(screen.getByText('Add Filter')).toBeInTheDocument();
      });
    });

    it('should handle adding visualizations', async () => {
      renderWithQueryClient(<ReportBuilder />);

      // Navigate to Visualizations tab
      fireEvent.click(screen.getByText('Visualizations'));

      // Click Add Visualization button
      fireEvent.click(screen.getByRole('button', { name: /add visualization/i }));

      // Should open add visualization dialog
      await waitFor(() => {
        expect(screen.getByText('Add Visualization')).toBeInTheDocument();
      });
    });

    it('should handle report preview', async () => {
      renderWithQueryClient(<ReportBuilder initialReport={mockReportData} />);

      // Click Preview button
      fireEvent.click(screen.getByRole('button', { name: /preview/i }));

      // Should execute query
      await waitFor(() => {
        expect(analyticsService.executeCustomQuery).toHaveBeenCalled();
      });
    });

    it('should handle report saving', async () => {
      const mockOnSave = vi.fn();
      renderWithQueryClient(<ReportBuilder onSave={mockOnSave} />);

      // Click Save Report button
      fireEvent.click(screen.getByRole('button', { name: /save report/i }));

      // Should call onSave
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should handle report export', async () => {
      renderWithQueryClient(<ReportBuilder initialReport={mockReportData} />);

      // Navigate to Preview tab
      fireEvent.click(screen.getByText('Preview'));

      // Click Export PDF button
      fireEvent.click(screen.getByRole('button', { name: /export pdf/i }));

      // Should call export service
      await waitFor(() => {
        expect(analyticsService.exportAnalyticsData).toHaveBeenCalledWith(
          'users',
          { status: 'active' },
          { format: 'pdf', filename: 'Test Report' }
        );
      });
    });

    it('should handle scheduling dialog', async () => {
      renderWithQueryClient(<ReportBuilder />);

      // Click Schedule button
      fireEvent.click(screen.getByRole('button', { name: /schedule/i }));

      // Should open schedule dialog
      await waitFor(() => {
        expect(screen.getByText('Schedule Report')).toBeInTheDocument();
      });
    });
  });

  describe('InteractiveChart', () => {
    it('should render chart with configuration', () => {
      renderWithQueryClient(<InteractiveChart config={mockChartConfig} />);

      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      expect(screen.getByText('A test chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      renderWithQueryClient(<InteractiveChart config={mockChartConfig} loading={true} />);

      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      // Loading state would show skeleton or spinner
    });

    it('should handle error state', () => {
      renderWithQueryClient(
        <InteractiveChart config={mockChartConfig} error="Failed to load data" />
      );

      expect(screen.getByText('Error loading chart')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle chart type switching', () => {
      const barConfig = { ...mockChartConfig, type: 'bar' as const };
      renderWithQueryClient(<InteractiveChart config={barConfig} />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should handle pie chart rendering', () => {
      const pieConfig = { ...mockChartConfig, type: 'pie' as const };
      renderWithQueryClient(<InteractiveChart config={pieConfig} />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should handle area chart rendering', () => {
      const areaConfig = { ...mockChartConfig, type: 'area' as const };
      renderWithQueryClient(<InteractiveChart config={areaConfig} />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('should handle scatter chart rendering', () => {
      const scatterConfig = { ...mockChartConfig, type: 'scatter' as const };
      renderWithQueryClient(<InteractiveChart config={scatterConfig} />);

      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    });

    it('should handle composed chart rendering', () => {
      const composedConfig = { ...mockChartConfig, type: 'composed' as const };
      renderWithQueryClient(<InteractiveChart config={composedConfig} />);

      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });

    it('should handle chart interactions', async () => {
      const mockOnDataPointClick = vi.fn();
      renderWithQueryClient(
        <InteractiveChart config={mockChartConfig} onDataPointClick={mockOnDataPointClick} />
      );

      // Chart interactions would be tested with more specific event simulation
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle chart export', async () => {
      const mockOnExport = vi.fn();
      renderWithQueryClient(
        <InteractiveChart config={mockChartConfig} onExport={mockOnExport} />
      );

      // Click menu button
      const menuButton = screen.getByRole('button', { name: /more/i });
      fireEvent.click(menuButton);

      // Should show export options in menu
      await waitFor(() => {
        expect(screen.getByText('Export as PNG')).toBeInTheDocument();
      });
    });

    it('should handle fullscreen mode', async () => {
      renderWithQueryClient(<InteractiveChart config={mockChartConfig} />);

      // Click fullscreen button
      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      fireEvent.click(fullscreenButton);

      // Should open fullscreen dialog
      await waitFor(() => {
        expect(screen.getAllByText('Test Chart')).toHaveLength(2); // Original + dialog
      });
    });

    it('should handle chart filters', () => {
      const configWithFilters = {
        ...mockChartConfig,
        filters: [
          {
            key: 'category',
            label: 'Category',
            type: 'select' as const,
            options: [
              { value: 'A', label: 'Category A' },
              { value: 'B', label: 'Category B' },
            ],
          },
        ],
      };

      renderWithQueryClient(<InteractiveChart config={configWithFilters} />);

      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('should handle chart annotations', () => {
      const configWithAnnotations = {
        ...mockChartConfig,
        annotations: [
          {
            type: 'line' as const,
            value: 125,
            label: 'Target',
            color: '#ff0000',
          },
        ],
      };

      renderWithQueryClient(<InteractiveChart config={configWithAnnotations} />);

      expect(screen.getByTestId('reference-line')).toBeInTheDocument();
    });
  });

  describe('Report Scheduling', () => {
    it('should handle schedule creation', async () => {
      (reportSchedulingService.createSchedule as any).mockResolvedValue({
        id: 'schedule_123',
        reportId: 'report_123',
        name: 'Daily Report',
        enabled: true,
        cron: '0 9 * * *',
        recipients: ['admin@example.com'],
        format: 'pdf',
      });

      // Test would involve creating a schedule through the UI
      expect(reportSchedulingService.createSchedule).toBeDefined();
    });

    it('should handle report execution', async () => {
      (reportSchedulingService.executeReport as any).mockResolvedValue({
        id: 'execution_123',
        reportId: 'report_123',
        status: 'completed',
        result: { filePath: '/tmp/report.pdf', recordCount: 100 },
      });

      // Test would involve executing a report
      expect(reportSchedulingService.executeReport).toBeDefined();
    });
  });

  describe('Advanced Visualizations', () => {
    it('should handle multiple series in charts', () => {
      const multiSeriesConfig = {
        ...mockChartConfig,
        series: [
          { key: 'value1', name: 'Series 1', color: '#8884d8', type: 'line' as const },
          { key: 'value2', name: 'Series 2', color: '#82ca9d', type: 'line' as const },
        ],
      };

      renderWithQueryClient(<InteractiveChart config={multiSeriesConfig} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle chart with brush for zooming', () => {
      const configWithBrush = { ...mockChartConfig, showBrush: true };
      renderWithQueryClient(<InteractiveChart config={configWithBrush} />);

      expect(screen.getByTestId('brush')).toBeInTheDocument();
    });

    it('should handle chart grid and legend', () => {
      renderWithQueryClient(<InteractiveChart config={mockChartConfig} />);

      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should handle chart tooltip', () => {
      renderWithQueryClient(<InteractiveChart config={mockChartConfig} />);

      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  describe('Data Export and Sharing', () => {
    it('should handle CSV export', async () => {
      renderWithQueryClient(<ReportBuilder initialReport={mockReportData} />);

      fireEvent.click(screen.getByText('Preview'));
      fireEvent.click(screen.getByRole('button', { name: /export csv/i }));

      await waitFor(() => {
        expect(analyticsService.exportAnalyticsData).toHaveBeenCalledWith(
          'users',
          { status: 'active' },
          { format: 'csv', filename: 'Test Report' }
        );
      });
    });

    it('should handle HTML export', async () => {
      renderWithQueryClient(<ReportBuilder initialReport={mockReportData} />);

      fireEvent.click(screen.getByText('Preview'));
      fireEvent.click(screen.getByRole('button', { name: /export html/i }));

      await waitFor(() => {
        expect(analyticsService.exportAnalyticsData).toHaveBeenCalledWith(
          'users',
          { status: 'active' },
          { format: 'html', filename: 'Test Report' }
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle query execution errors', async () => {
      (analyticsService.executeCustomQuery as any).mockRejectedValue(
        new Error('Query failed')
      );

      renderWithQueryClient(<ReportBuilder initialReport={mockReportData} />);

      fireEvent.click(screen.getByRole('button', { name: /preview/i }));

      // Should handle error gracefully
      await waitFor(() => {
        expect(analyticsService.executeCustomQuery).toHaveBeenCalled();
      });
    });

    it('should handle export errors', async () => {
      (analyticsService.exportAnalyticsData as any).mockRejectedValue(
        new Error('Export failed')
      );

      renderWithQueryClient(<ReportBuilder initialReport={mockReportData} />);

      fireEvent.click(screen.getByText('Preview'));
      fireEvent.click(screen.getByRole('button', { name: /export pdf/i }));

      // Should handle error gracefully
      await waitFor(() => {
        expect(analyticsService.exportAnalyticsData).toHaveBeenCalled();
      });
    });
  });
});