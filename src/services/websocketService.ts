import { io, Socket } from 'socket.io-client';

export interface RealtimeMetrics {
  timestamp: Date;
  totalEvents: number;
  uniqueUsers: number;
  activeUsers: number;
  errorRate: number;
  avgResponseTime: number;
  systemUptime: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  activeGames: number;
}

export interface MetricAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  message: string;
}

export interface WebSocketServiceOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(private options: WebSocketServiceOptions = {}) {
    this.options = {
      url: '/socket.io',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...options,
    };

    if (this.options.autoConnect) {
      this.connect();
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      try {
        this.socket = io(this.options.url!, {
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          autoConnect: true,
          reconnection: this.options.reconnection,
          reconnectionAttempts: this.options.reconnectionAttempts,
          reconnectionDelay: this.options.reconnectionDelay,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.isConnected = false;
          this.emit('disconnected', reason);
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          this.emit('error', error);
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
          } else {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
          }
        });

        // Set up real-time metric listeners
        this.setupMetricListeners();

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  private setupMetricListeners(): void {
    if (!this.socket) return;

    // Real-time metrics updates
    this.socket.on('metrics:update', (metrics: RealtimeMetrics) => {
      this.emit('metrics:update', metrics);
    });

    // Alert notifications
    this.socket.on('alert:triggered', (alert: MetricAlert) => {
      this.emit('alert:triggered', alert);
    });

    // System health updates
    this.socket.on('system:health', (health: any) => {
      this.emit('system:health', health);
    });

    // User activity updates
    this.socket.on('users:activity', (activity: any) => {
      this.emit('users:activity', activity);
    });

    // Game room updates
    this.socket.on('rooms:update', (rooms: any) => {
      this.emit('rooms:update', rooms);
    });
  }

  // Subscribe to real-time metrics
  subscribeToMetrics(callback: (metrics: RealtimeMetrics) => void): () => void {
    this.on('metrics:update', callback);
    
    // Request initial metrics
    if (this.socket?.connected) {
      this.socket.emit('metrics:subscribe');
    }

    return () => this.off('metrics:update', callback);
  }

  // Subscribe to alerts
  subscribeToAlerts(callback: (alert: MetricAlert) => void): () => void {
    this.on('alert:triggered', callback);
    
    if (this.socket?.connected) {
      this.socket.emit('alerts:subscribe');
    }

    return () => this.off('alert:triggered', callback);
  }

  // Subscribe to system health
  subscribeToSystemHealth(callback: (health: any) => void): () => void {
    this.on('system:health', callback);
    
    if (this.socket?.connected) {
      this.socket.emit('system:subscribe');
    }

    return () => this.off('system:health', callback);
  }

  // Generic event subscription
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Send custom events
  send(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot send event:', event);
    }
  }

  // Connection status
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Get connection info
  getConnectionInfo(): { connected: boolean; id?: string; transport?: string } {
    return {
      connected: this.connected,
      id: this.socket?.id,
      transport: this.socket?.io.engine?.transport?.name,
    };
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

export default websocketService;