import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils'
import { Sidebar } from '../Sidebar'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => ({ pathname: '/dashboard' }),
    useNavigate: () => vi.fn(),
  }
})

describe('Sidebar', () => {
  it('renders all navigation items', () => {
    render(<Sidebar open={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Database')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Socket Monitoring')).toBeInTheDocument()
    expect(screen.getByText('API Testing')).toBeInTheDocument()
    expect(screen.getByText('System Monitoring')).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    render(<Sidebar open={true} onClose={vi.fn()} />)
    
    const dashboardItem = screen.getByText('Dashboard').closest('li')
    expect(dashboardItem).toHaveClass('Mui-selected')
  })

  it('shows collapsed state when open is false', () => {
    render(<Sidebar open={false} onClose={vi.fn()} />)
    
    const drawer = screen.getByRole('presentation')
    expect(drawer).toHaveClass('MuiDrawer-paperAnchorLeft')
  })

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn()
    render(<Sidebar open={true} onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows user info section', () => {
    render(<Sidebar open={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Admin Portal')).toBeInTheDocument()
  })

  it('renders navigation icons', () => {
    render(<Sidebar open={true} onClose={vi.fn()} />)
    
    // Check for presence of icons (they should be in the DOM)
    const listItems = screen.getAllByRole('listitem')
    expect(listItems.length).toBeGreaterThan(0)
  })

  it('handles navigation item clicks', () => {
    const mockNavigate = vi.fn()
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate)
    
    render(<Sidebar open={true} onClose={vi.fn()} />)
    
    const databaseItem = screen.getByText('Database')
    fireEvent.click(databaseItem)
    
    expect(mockNavigate).toHaveBeenCalledWith('/database')
  })

  it('shows version information', () => {
    render(<Sidebar open={true} onClose={vi.fn()} />)
    
    expect(screen.getByText(/version/i)).toBeInTheDocument()
  })
})