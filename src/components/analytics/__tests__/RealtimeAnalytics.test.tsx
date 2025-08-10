import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DashboardOverview from '../DashboardOverview';
import CustomizableDashboard from '../CustomizableDashboard';
import AlertNotificationSystem from '../AlertNotificationSystem';
import { useRealtimeMetrics } from '../../../hooks/useRealtimeMetrics';
import { websocketService } from '../../../services/websocketService';

// Mock the WebSocket service
vi.mock('../../../services/websocketService', () => ({
  websocketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribeToMetrics: vi.fn(),
    subscribeToAlerts: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    send: vi.fn(),
    connected: true,
    getConnectionInfo: vi.fn(() => ({ connected: true, id: 'test-id' })),
  },
}));

// Mock the real-time metrics hook
vi.mock('../../../hooks/useRealtimeMetrics', () => ({
  useRealtimeMetrics: vi.fn(),
}));

// Mock react-rnd
vi.mock('react-rnd', () => ({
  Rnd: ({ children, ...props }: any) => (
    <div data-testid="rnd-component" {...props}>
      {children}
    </div>
  ),
}));

const mockMetrics = {
  overview: {
    totalEvents: 12345,
    uniqueUsers: 1234,
    activeUsers: 567,
    errorRate: 2.5,
    avgResponseTime: 150,
    systemUptime: 86400,
  },
  games: {
    GAME_START: 100,
    GAME_END: 95,
  },
  errors: {},
  performance: {},
  engagement: {},
  system: {
    memoryUsage: {
      heapUsed: 50 * 1024 * 1024,
      heapTotal: 100 * 1024 * 1024,
      external: 10 * 1024 * 1024,
    },
  },
  timeRange: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-02'),
    granularity: 'hour',
  },
  generatedAt: new Date('2024-01-02T10:00:00Z'),
};

const mockAlerts = [
  {
    id: 'alert-1',
    ruleId: 'rule-1',
    ruleName: 'High Error Rate',
    metric: 'errorRate',
    value: 5.2,
    threshold: 5.0,
    severity: 'high' as const,
    timestamp: new Date('2024-01-02T10:00:00Z'),
    message: 'Error rate exceeded threshold',
  },
  {
    id: 'alert-2',
    ruleId: 'rule-2',
    ruleName: 'Low Memory',
    metric: 'memoryUsage',
    value: 90,
    threshold: 85,
    severity: 'critical' as const,
    timestamp: new Date('2024-01-02T10:05:00Z'),
    message: 'Memory usage critically high',
  },
];

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

describe('Real-time Analytics Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRealtimeMetrics as any).mockReturnValue({
      metrics: mockMetrics,
      isConnected: true,
      isLoading: false,
      error: null,
      lastUpdate: new Date('2024-01-02T10:00:00Z'),
      alerts: mockAlerts,
      refresh: vi.fn(),
      clearAlerts: vi.fn(),
      dismissAlert: vi.fn(),
      connectionInfo: { connected: true, id: 'test-id' },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('DashboardOverview with Real-time', () => {
    it('should render real-time dashboard overview', async () => {
      renderWithQueryClient(
        <DashboardOverview enableRealtime={true} />
      );

      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText('12,345')).toBeInTheDocument(); // Total events
      expect(screen.getByText('1,234')).toBeInTheDocument(); // Unique users
    });

    it('should show connection status indicator', () => {
      renderWithQueryClient(
        <DashboardOverview enableRealtime={true} />
      );

      const liveIndicator = screen.getByText('Live');
      expect(liveIndicator).toBeInTheDocument();
    });

    it('should display last update time', () => {
      renderWithQueryClient(
        <DashboardOverview enableRealtime={true} />
      );

      expect(screen.getByText(/Updated:/)).toBeInTheDocument();
    });

    it('should handle refresh button click', () => {
      const mockRefresh = vi.fn();
      (useRealtimeMetrics as any).mockReturnValue({
        ...mockMetrics,
        refresh: mockRefresh,
        isConnected: true,
        isLoading: false,
      });

      renderWithQueryClient(
        <DashboardOverview enableRealtime={true} />
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should show error alert when connection fails', () => {
      (useRealtimeMetrics as any).mockReturnValue({
        metrics: null,
        isConnected: false,
        isLoading: false,
        error: 'Connection failed',
        alerts: [],
        refresh: vi.fn(),
        clearAlerts: vi.fn(),
        dismissAlert: vi.fn(),
      });

      renderWithQueryClient(
        <DashboardOverview enableRealtime={true} />
      );

      expect(screen.getByText(/Real-time connection issue/)).toBeInTheDocument();
      expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
    });
  });

  describe('AlertNotificationSystem', () => {
    it('should render alert notification bell', () => {
      renderWithQueryClient(<AlertNotificationSystem />);

      const alertButton = screen.getByRole('button');
      expect(alertButton).toBeInTheDocument();
    });

    it('should show alert count badge', () => {
      renderWithQueryClient(<AlertNotificationSystem />);

      // Should show badge with alert count
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 alerts in mock data
    });

    it('should open alert drawer when clicked', async () => {
      renderWithQueryClient(<AlertNotificationSystem />);

      const alertButton = screen.getByRole('button');
      fireEvent.click(alertButton);

      await waitFor(() => {
        expect(screen.getByText('Alerts (2)')).toBeInTheDocument();
        expect(screen.getByText('High Error Rate')).toBeInTheDocument();
        expect(screen.getByText('Low Memory')).toBeInTheDocument();
      });
    });

    it('should handle alert dismissal', async () => {
      const mockDismissAlert = vi.fn();
      (useRealtimeMetrics as any).mockReturnValue({
        metrics: mockMetrics,
        alerts: mockAlerts,
        dismissAlert: mockDismissAlert,
        clearAlerts: vi.fn(),
        isConnected: true,
        isLoading: false,
      });

      renderWithQueryClient(<AlertNotificationSystem />);

      const alertButton = screen.getByRole('button');
      fireEvent.click(alertButton);

      await waitFor(() => {
        const dismissButtons = screen.getAllByRole('button', { name: /close/i });
        fireEvent.click(dismissButtons[1]); // First close button is for drawer
      });

      expect(mockDismissAlert).toHaveBeenCalled();
    });
  });

  describe('CustomizableDashboard', () => {
    it('should render customizable dashboard', () => {
      renderWithQueryClient(<CustomizableDashboard />);

      expect(screen.getByText('New Dashboard')).toBeInTheDocument();
    });

    it('should enter edit mode when edit button is clicked', () => {
      renderWithQueryClient(<CustomizableDashboard />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show empty state when no widgets', () => {
      renderWithQueryClient(<CustomizableDashboard />);

      expect(screen.getByText('Empty Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Switch to edit mode to customize/)).toBeInTheDocument();
    });

    it('should show add widget button in edit mode', () => {
      renderWithQueryClient(<CustomizableDashboard />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      // Should show FAB for adding widgets
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });
  });

  describe('WebSocket Service Integration', () => {
    it('should connect to WebSocket service', () => {
      renderWithQueryClient(<DashboardOverview enableRealtime={true} />);

      expect(websocketService.connect).toHaveBeenCalled();
    });

    it('should subscribe to metrics updates', () => {
      renderWithQueryClient(<DashboardOverview enableRealtime={true} />);

      expect(websocketService.subscribeToMetrics).toHaveBeenCalled();
    });

    it('should handle WebSocket disconnection gracefully', () => {
      (useRealtimeMetrics as any).mockReturnValue({
        metrics: mockMetrics,
        isConnected: false,
        isLoading: false,
        error: null,
        alerts: [],
        refresh: vi.fn(),
        clearAlerts: vi.fn(),
        dismissAlert: vi.fn(),
      });

      renderWithQueryClient(<DashboardOverview enableRealtime={true} />);

      expect(screen.getByText('Polling')).toBeInTheDocument();
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle loading state', () => {
      (useRealtimeMetrics as any).mockReturnValue({
        metrics: null,
        isConnected: true,
        isLoading: true,
        error: null,
        alerts: [],
        refresh: vi.fn(),
        clearAlerts: vi.fn(),
        dismissAlert: vi.fn(),
      });

      renderWithQueryClient(<DashboardOverview enableRealtime={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should fallback to polling when WebSocket fails', () => {
      (useRealtimeMetrics as any).mockReturnValue({
        metrics: mockMetrics,
        isConnected: false,
        isLoading: false,
        error: 'WebSocket connection failed',
        alerts: [],
        refresh: vi.fn(),
        clearAlerts: vi.fn(),
        dismissAlert: vi.fn(),
      });

      renderWithQueryClient(<DashboardOverview enableRealtime={true} />);

      expect(screen.getByText('Polling')).toBeInTheDocument();
      expect(screen.getByText(/WebSocket connection failed/)).toBeInTheDocument();
    });

    it('should handle metric update errors gracefully', () => {
      (useRealtimeMetrics as any).mockReturnValue({
        metrics: null,
        isConnected: true,
        isLoading: false,
        error: 'Failed to fetch metrics',
        alerts: [],
        refresh: vi.fn(),
        clearAlerts: vi.fn(),
        dismissAlert: vi.fn(),
      });

      renderWithQueryClient(<DashboardOverview enableRealtime={true} />);

      expect(screen.getByText(/Failed to fetch metrics/)).toBeInTheDocument();
    });
  });
});