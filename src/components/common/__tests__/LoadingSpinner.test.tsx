import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test/utils'
import { LoadingSpinner } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    render(<LoadingSpinner size={60} />)
    
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveStyle({ width: '60px', height: '60px' })
  })

  it('renders with custom color', () => {
    render(<LoadingSpinner color="secondary" />)
    
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with message', () => {
    const message = 'Loading data...'
    render(<LoadingSpinner message={message} />)
    
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it('centers content when centered prop is true', () => {
    render(<LoadingSpinner centered />)
    
    const container = screen.getByRole('progressbar').parentElement
    expect(container).toHaveStyle({
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    })
  })
})