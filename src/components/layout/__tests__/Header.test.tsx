import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils'
import { Header } from '../Header'

// Mock the auth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../../hooks/useAuth'

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>

describe('Header', () => {
  const mockUser = {
    id: '1',
    username: 'admin',
    email: 'admin@test.com',
    role: 'super_admin',
  }

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
  })

  it('renders the header with title', () => {
    render(<Header />)
    
    expect(screen.getByText('Admin Portal')).toBeInTheDocument()
  })

  it('displays user information when authenticated', () => {
    render(<Header />)
    
    expect(screen.getByText(mockUser.username)).toBeInTheDocument()
  })

  it('shows theme toggle button', () => {
    render(<Header />)
    
    const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
    expect(themeToggle).toBeInTheDocument()
  })

  it('shows notifications button', () => {
    render(<Header />)
    
    const notificationsButton = screen.getByRole('button', { name: /notifications/i })
    expect(notificationsButton).toBeInTheDocument()
  })

  it('opens user menu when avatar is clicked', () => {
    render(<Header />)
    
    const avatar = screen.getByRole('button', { name: /account/i })
    fireEvent.click(avatar)
    
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('calls logout when logout is clicked', () => {
    const mockLogout = vi.fn()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: mockLogout,
    })

    render(<Header />)
    
    const avatar = screen.getByRole('button', { name: /account/i })
    fireEvent.click(avatar)
    
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)
    
    expect(mockLogout).toHaveBeenCalled()
  })

  it('shows mobile menu button on small screens', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    })

    render(<Header />)
    
    const mobileMenuButton = screen.getByRole('button', { name: /menu/i })
    expect(mobileMenuButton).toBeInTheDocument()
  })

  it('displays notification badge when there are notifications', () => {
    render(<Header notificationCount={5} />)
    
    const badge = screen.getByText('5')
    expect(badge).toBeInTheDocument()
  })
})