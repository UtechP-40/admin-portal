// Testing-related types

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: ApiTest[];
  environment: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isActive: boolean;
}

export interface ApiTest {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body?: string;
  expectedStatus: number;
  expectedResponse?: any;
  assertions: TestAssertion[];
  timeout: number;
  retries: number;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestAssertion {
  id: string;
  type: 'status' | 'header' | 'body' | 'response_time' | 'json_path' | 'regex';
  field?: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists' | 'matches';
  expectedValue: any;
  description: string;
}

export interface TestExecution {
  id: string;
  testId: string;
  suiteId?: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result?: TestResult;
  error?: string;
  retryCount: number;
}

export interface TestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
  assertions: AssertionResult[];
  passed: boolean;
  error?: string;
}

export interface AssertionResult {
  assertionId: string;
  passed: boolean;
  actualValue: any;
  expectedValue: any;
  error?: string;
}

export interface TestSchedule {
  id: string;
  name: string;
  suiteId: string;
  cronExpression: string;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  environment: string;
  notifications: NotificationConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationConfig {
  type: 'email' | 'webhook' | 'slack';
  target: string;
  onSuccess: boolean;
  onFailure: boolean;
  onError: boolean;
}

export interface TestReport {
  id: string;
  suiteId: string;
  executionId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  averageResponseTime: number;
  successRate: number;
  executions: TestExecution[];
  generatedAt: Date;
  environment: string;
}

export interface ApiDocumentation {
  openApiSpec?: any;
  endpoints: ApiEndpoint[];
  baseUrl: string;
  version: string;
  title: string;
  description: string;
}

export interface ApiEndpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: Record<string, ApiResponse>;
  tags: string[];
  operationId: string;
}

export interface ApiParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  schema: any;
  description: string;
  example?: any;
}

export interface ApiRequestBody {
  required: boolean;
  content: Record<string, {
    schema: any;
    example?: any;
  }>;
}

export interface ApiResponse {
  description: string;
  content?: Record<string, {
    schema: any;
    example?: any;
  }>;
  headers?: Record<string, any>;
}

export interface LoadTestConfig {
  id: string;
  name: string;
  description: string;
  testId: string;
  concurrentUsers: number;
  duration: number; // in seconds
  rampUpTime: number; // in seconds
  requestsPerSecond?: number;
  environment: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoadTestResult {
  id: string;
  configId: string;
  startTime: Date;
  endTime: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  throughput: number;
  responseTimePercentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  errors: LoadTestError[];
  metrics: LoadTestMetric[];
}

export interface LoadTestError {
  timestamp: Date;
  error: string;
  count: number;
}

export interface LoadTestMetric {
  timestamp: Date;
  responseTime: number;
  requestsPerSecond: number;
  activeUsers: number;
  errorRate: number;
}

export interface SocketTestSession {
  id: string;
  name: string;
  description: string;
  url: string;
  namespace: string;
  events: SocketTestEvent[];
  recordings: SocketRecording[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocketTestEvent {
  id: string;
  name: string;
  event: string;
  data: any;
  expectedResponse?: any;
  timeout: number;
  description: string;
}

export interface SocketRecording {
  id: string;
  name: string;
  events: RecordedSocketEvent[];
  duration: number;
  createdAt: Date;
}

export interface RecordedSocketEvent {
  timestamp: number;
  type: 'emit' | 'receive';
  event: string;
  data: any;
}

export interface SocketLoadTestConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  namespace: string;
  concurrentConnections: number;
  duration: number;
  eventsPerSecond: number;
  testEvents: SocketTestEvent[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocketLoadTestResult {
  id: string;
  configId: string;
  startTime: Date;
  endTime: Date;
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  averageLatency: number;
  connectionErrors: string[];
  eventErrors: string[];
  metrics: SocketLoadTestMetric[];
}

export interface SocketLoadTestMetric {
  timestamp: Date;
  activeConnections: number;
  eventsPerSecond: number;
  averageLatency: number;
  errorRate: number;
}