import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/utils'
import { ProtectedRoute } from '../ProtectedRoute'

// Mock the auth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../../hooks/useAuth'

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>

describe('ProtectedRoute', () => {
  const TestComponent = () => <div>Protected Content</div>

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'admin' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('shows loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    // In a real app, this would redirect to login page
  })

  it('checks required permissions when provided', () => {
    mockUseAuth.mockReturnValue({
      user: { 
        id: '1', 
        username: 'admin',
        permissions: ['read', 'write']
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <ProtectedRoute requiredPermissions={['read']}>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('denies access when user lacks required permissions', () => {
    mockUseAuth.mockReturnValue({
      user: { 
        id: '1', 
        username: 'admin',
        permissions: ['read']
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <ProtectedRoute requiredPermissions={['admin']}>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })
})