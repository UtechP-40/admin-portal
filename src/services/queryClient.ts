import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          if (
            error?.response?.status === 408 ||
            error?.response?.status === 429
          ) {
            return failureCount < 2;
          }
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // You can add global error handling here
      },
    },
  },
});

// Query keys factory
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  currentUser: () => [...queryKeys.auth, 'currentUser'] as const,

  // Database
  database: ['database'] as const,
  collections: () => [...queryKeys.database, 'collections'] as const,
  collection: (name: string) =>
    [...queryKeys.database, 'collection', name] as const,
  documents: (collection: string, page?: number, limit?: number) =>
    [
      ...queryKeys.collection(collection),
      'documents',
      { page, limit },
    ] as const,

  // Analytics
  analytics: ['analytics'] as const,
  dashboard: () => [...queryKeys.analytics, 'dashboard'] as const,
  metrics: (timeRange: string) =>
    [...queryKeys.analytics, 'metrics', timeRange] as const,

  // Monitoring
  monitoring: ['monitoring'] as const,
  systemHealth: () => [...queryKeys.monitoring, 'systemHealth'] as const,
  logs: (level?: string, limit?: number) =>
    [...queryKeys.monitoring, 'logs', { level, limit }] as const,

  // Settings
  settings: ['settings'] as const,
  userSettings: () => [...queryKeys.settings, 'userSettings'] as const,
  systemSettings: () => [...queryKeys.settings, 'systemSettings'] as const,
};

export default queryClient;
