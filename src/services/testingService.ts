import { apiService } from './api';
import type {
  TestSuite,
  ApiTest,
  TestExecution,
  TestResult,
  TestSchedule,
  TestReport,
  ApiDocumentation,
  LoadTestConfig,
  LoadTestResult,
  SocketTestSession,
  SocketLoadTestConfig,
  SocketLoadTestResult,
  TestAssertion,
  AssertionResult,
} from '../types/testing';

class TestingService {
  // Test Suite Management
  async getTestSuites(): Promise<TestSuite[]> {
    const response = await apiService.get('/admin/testing/suites');
    return response.data;
  }

  async getTestSuite(id: string): Promise<TestSuite> {
    const response = await apiService.get(`/admin/testing/suites/${id}`);
    return response.data;
  }

  async createTestSuite(suite: Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestSuite> {
    const response = await apiService.post('/admin/testing/suites', suite);
    return response.data;
  }

  async updateTestSuite(id: string, suite: Partial<TestSuite>): Promise<TestSuite> {
    const response = await apiService.put(`/admin/testing/suites/${id}`, suite);
    return response.data;
  }

  async deleteTestSuite(id: string): Promise<void> {
    await apiService.delete(`/admin/testing/suites/${id}`);
  }

  async duplicateTestSuite(id: string, name: string): Promise<TestSuite> {
    const response = await apiService.post(`/admin/testing/suites/${id}/duplicate`, { name });
    return response.data;
  }

  // API Test Management
  async getApiTests(suiteId?: string): Promise<ApiTest[]> {
    const params = suiteId ? { suiteId } : {};
    const response = await apiService.get('/admin/testing/tests', { params });
    return response.data;
  }

  async getApiTest(id: string): Promise<ApiTest> {
    const response = await apiService.get(`/admin/testing/tests/${id}`);
    return response.data;
  }

  async createApiTest(test: Omit<ApiTest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiTest> {
    const response = await apiService.post('/admin/testing/tests', test);
    return response.data;
  }

  async updateApiTest(id: string, test: Partial<ApiTest>): Promise<ApiTest> {
    const response = await apiService.put(`/admin/testing/tests/${id}`, test);
    return response.data;
  }

  async deleteApiTest(id: string): Promise<void> {
    await apiService.delete(`/admin/testing/tests/${id}`);
  }

  // Test Execution
  async executeTest(testId: string, environment?: string): Promise<TestExecution> {
    const response = await apiService.post(`/admin/testing/tests/${testId}/execute`, { environment });
    return response.data;
  }

  async executeTestSuite(suiteId: string, environment?: string): Promise<TestExecution[]> {
    const response = await apiService.post(`/admin/testing/suites/${suiteId}/execute`, { environment });
    return response.data;
  }

  async getTestExecution(id: string): Promise<TestExecution> {
    const response = await apiService.get(`/admin/testing/executions/${id}`);
    return response.data;
  }

  async getTestExecutions(testId?: string, suiteId?: string): Promise<TestExecution[]> {
    const params: any = {};
    if (testId) params.testId = testId;
    if (suiteId) params.suiteId = suiteId;
    
    const response = await apiService.get('/admin/testing/executions', { params });
    return response.data;
  }

  async stopTestExecution(id: string): Promise<void> {
    await apiService.post(`/admin/testing/executions/${id}/stop`);
  }

  // Test Scheduling
  async getTestSchedules(): Promise<TestSchedule[]> {
    const response = await apiService.get('/admin/testing/schedules');
    return response.data;
  }

  async createTestSchedule(schedule: Omit<TestSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestSchedule> {
    const response = await apiService.post('/admin/testing/schedules', schedule);
    return response.data;
  }

  async updateTestSchedule(id: string, schedule: Partial<TestSchedule>): Promise<TestSchedule> {
    const response = await apiService.put(`/admin/testing/schedules/${id}`, schedule);
    return response.data;
  }

  async deleteTestSchedule(id: string): Promise<void> {
    await apiService.delete(`/admin/testing/schedules/${id}`);
  }

  async toggleTestSchedule(id: string, isActive: boolean): Promise<TestSchedule> {
    const response = await apiService.patch(`/admin/testing/schedules/${id}`, { isActive });
    return response.data;
  }

  // Test Reports
  async getTestReports(suiteId?: string): Promise<TestReport[]> {
    const params = suiteId ? { suiteId } : {};
    const response = await apiService.get('/admin/testing/reports', { params });
    return response.data;
  }

  async getTestReport(id: string): Promise<TestReport> {
    const response = await apiService.get(`/admin/testing/reports/${id}`);
    return response.data;
  }

  async generateTestReport(suiteId: string, executionId?: string): Promise<TestReport> {
    const response = await apiService.post('/admin/testing/reports', { suiteId, executionId });
    return response.data;
  }

  async exportTestReport(id: string, format: 'pdf' | 'html' | 'json'): Promise<Blob> {
    const response = await apiService.get(`/admin/testing/reports/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  // API Documentation Integration
  async getApiDocumentation(): Promise<ApiDocumentation> {
    const response = await apiService.get('/admin/testing/api-docs');
    return response.data;
  }

  async generateTestsFromDocumentation(endpoints: string[], suiteId: string): Promise<ApiTest[]> {
    const response = await apiService.post('/admin/testing/generate-from-docs', {
      endpoints,
      suiteId,
    });
    return response.data;
  }

  async validateApiDocumentation(): Promise<{ valid: boolean; errors: string[] }> {
    const response = await apiService.post('/admin/testing/validate-docs');
    return response.data;
  }

  // Load Testing
  async getLoadTestConfigs(): Promise<LoadTestConfig[]> {
    const response = await apiService.get('/admin/testing/load-tests');
    return response.data;
  }

  async createLoadTestConfig(config: Omit<LoadTestConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<LoadTestConfig> {
    const response = await apiService.post('/admin/testing/load-tests', config);
    return response.data;
  }

  async updateLoadTestConfig(id: string, config: Partial<LoadTestConfig>): Promise<LoadTestConfig> {
    const response = await apiService.put(`/admin/testing/load-tests/${id}`, config);
    return response.data;
  }

  async deleteLoadTestConfig(id: string): Promise<void> {
    await apiService.delete(`/admin/testing/load-tests/${id}`);
  }

  async executeLoadTest(configId: string): Promise<LoadTestResult> {
    const response = await apiService.post(`/admin/testing/load-tests/${configId}/execute`);
    return response.data;
  }

  async getLoadTestResults(configId?: string): Promise<LoadTestResult[]> {
    const params = configId ? { configId } : {};
    const response = await apiService.get('/admin/testing/load-test-results', { params });
    return response.data;
  }

  async getLoadTestResult(id: string): Promise<LoadTestResult> {
    const response = await apiService.get(`/admin/testing/load-test-results/${id}`);
    return response.data;
  }

  // Socket Testing
  async getSocketTestSessions(): Promise<SocketTestSession[]> {
    const response = await apiService.get('/admin/testing/socket-sessions');
    return response.data;
  }

  async createSocketTestSession(session: Omit<SocketTestSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocketTestSession> {
    const response = await apiService.post('/admin/testing/socket-sessions', session);
    return response.data;
  }

  async updateSocketTestSession(id: string, session: Partial<SocketTestSession>): Promise<SocketTestSession> {
    const response = await apiService.put(`/admin/testing/socket-sessions/${id}`, session);
    return response.data;
  }

  async deleteSocketTestSession(id: string): Promise<void> {
    await apiService.delete(`/admin/testing/socket-sessions/${id}`);
  }

  async startSocketRecording(sessionId: string): Promise<void> {
    await apiService.post(`/admin/testing/socket-sessions/${sessionId}/start-recording`);
  }

  async stopSocketRecording(sessionId: string): Promise<void> {
    await apiService.post(`/admin/testing/socket-sessions/${sessionId}/stop-recording`);
  }

  async playbackSocketRecording(sessionId: string, recordingId: string): Promise<void> {
    await apiService.post(`/admin/testing/socket-sessions/${sessionId}/playback/${recordingId}`);
  }

  // Socket Load Testing
  async getSocketLoadTestConfigs(): Promise<SocketLoadTestConfig[]> {
    const response = await apiService.get('/admin/testing/socket-load-tests');
    return response.data;
  }

  async createSocketLoadTestConfig(config: Omit<SocketLoadTestConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocketLoadTestConfig> {
    const response = await apiService.post('/admin/testing/socket-load-tests', config);
    return response.data;
  }

  async executeSocketLoadTest(configId: string): Promise<SocketLoadTestResult> {
    const response = await apiService.post(`/admin/testing/socket-load-tests/${configId}/execute`);
    return response.data;
  }

  async getSocketLoadTestResults(configId?: string): Promise<SocketLoadTestResult[]> {
    const params = configId ? { configId } : {};
    const response = await apiService.get('/admin/testing/socket-load-test-results', { params });
    return response.data;
  }

  // Assertion Helpers
  validateAssertion(assertion: TestAssertion, actualValue: any): AssertionResult {
    const result: AssertionResult = {
      assertionId: assertion.id,
      passed: false,
      actualValue,
      expectedValue: assertion.expectedValue,
    };

    try {
      switch (assertion.operator) {
        case 'equals':
          result.passed = actualValue === assertion.expectedValue;
          break;
        case 'not_equals':
          result.passed = actualValue !== assertion.expectedValue;
          break;
        case 'contains':
          result.passed = String(actualValue).includes(String(assertion.expectedValue));
          break;
        case 'not_contains':
          result.passed = !String(actualValue).includes(String(assertion.expectedValue));
          break;
        case 'greater_than':
          result.passed = Number(actualValue) > Number(assertion.expectedValue);
          break;
        case 'less_than':
          result.passed = Number(actualValue) < Number(assertion.expectedValue);
          break;
        case 'exists':
          result.passed = actualValue !== undefined && actualValue !== null;
          break;
        case 'not_exists':
          result.passed = actualValue === undefined || actualValue === null;
          break;
        case 'matches':
          const regex = new RegExp(assertion.expectedValue);
          result.passed = regex.test(String(actualValue));
          break;
        default:
          result.error = `Unknown operator: ${assertion.operator}`;
      }
    } catch (error: any) {
      result.error = error.message;
    }

    return result;
  }

  // Utility Methods
  async importTestSuite(file: File): Promise<TestSuite> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiService.post('/admin/testing/suites/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async exportTestSuite(suiteId: string, format: 'json' | 'postman'): Promise<Blob> {
    const response = await apiService.get(`/admin/testing/suites/${suiteId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  async getEnvironmentVariables(): Promise<Record<string, string>> {
    const response = await apiService.get('/admin/testing/environment-variables');
    return response.data;
  }

  async updateEnvironmentVariables(variables: Record<string, string>): Promise<void> {
    await apiService.put('/admin/testing/environment-variables', variables);
  }
}

export const testingService = new TestingService();