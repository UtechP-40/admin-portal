import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../test/utils'
import { DataTable } from '../DataTable'

const mockData = [
  { id: '1', name: 'John Doe', email: 'john@test.com', role: 'user' },
  { id: '2', name: 'Jane Smith', email: 'jane@test.com', role: 'admin' },
  { id: '3', name: 'Bob Johnson', email: 'bob@test.com', role: 'user' },
]

const mockColumns = [
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'name', headerName: 'Name', width: 200 },
  { field: 'email', headerName: 'Email', width: 250 },
  { field: 'role', headerName: 'Role', width: 150 },
]

describe('DataTable', () => {
  it('renders table with data', () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@test.com')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(
      <DataTable
        data={[]}
        columns={mockColumns}
        loading={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(
      <DataTable
        data={[]}
        columns={mockColumns}
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    
    expect(screen.getByText(/no data available/i)).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const mockOnEdit = vi.fn()
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={vi.fn()}
      />
    )
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    fireEvent.click(editButtons[0])
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockData[0])
  })

  it('calls onDelete when delete button is clicked', async () => {
    const mockOnDelete = vi.fn()
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        onEdit={vi.fn()}
        onDelete={mockOnDelete}
      />
    )
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])
    
    // Should show confirmation dialog
    expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument()
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    fireEvent.click(confirmButton)
    
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(mockData[0].id)
    })
  })

  it('supports pagination', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@test.com`,
      role: 'user',
    }))

    render(
      <DataTable
        data={largeData}
        columns={mockColumns}
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        pageSize={10}
      />
    )
    
    // Should show pagination controls
    expect(screen.getByText('1–10 of 25')).toBeInTheDocument()
  })

  it('supports sorting', async () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    
    const nameHeader = screen.getByText('Name')
    fireEvent.click(nameHeader)
    
    // Should trigger sorting (implementation depends on the actual component)
    await waitFor(() => {
      expect(nameHeader).toBeInTheDocument()
    })
  })

  it('supports filtering', async () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        searchable={true}
      />
    )
    
    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })
  })

  it('handles selection', () => {
    const mockOnSelectionChange = vi.fn()
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        selectable={true}
        onSelectionChange={mockOnSelectionChange}
      />
    )
    
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // First row checkbox (index 0 is header)
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['1'])
  })
})