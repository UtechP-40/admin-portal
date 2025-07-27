import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { theme } from '../theme/theme'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data generators
export const mockUser = {
  id: '1',
  username: 'admin',
  email: 'admin@test.com',
  role: 'super_admin',
  permissions: ['read', 'write', 'delete'],
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
}

export const mockGameRoom = {
  id: 'room-1',
  name: 'Test Room',
  players: 5,
  maxPlayers: 10,
  status: 'active',
  gamePhase: 'day',
  createdAt: new Date().toISOString(),
}

export const mockAnalyticsData = {
  totalUsers: 1000,
  activeUsers: 250,
  totalGames: 500,
  averageGameDuration: 1800,
  userGrowth: 15.5,
  gameCompletionRate: 85.2,
}

export const mockSocketConnection = {
  id: 'socket-1',
  userId: 'user-1',
  roomId: 'room-1',
  connected: true,
  lastActivity: new Date().toISOString(),
  latency: 45,
}

// Test helpers
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0))

export const createMockApiResponse = <T>(data: T, delay = 0) =>
  new Promise<T>(resolve => setTimeout(() => resolve(data), delay))

export const createMockApiError = (message: string, status = 500) =>
  Promise.reject({
    response: {
      status,
      data: { message },
    },
  })