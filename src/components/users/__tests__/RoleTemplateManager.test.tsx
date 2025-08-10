import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RoleTemplateManager from '../RoleTemplateManager';
import { userManagementApi } from '../../../services/userManagementApi';

// Mock the API
jest.mock('../../../services/userManagementApi');
const mockUserManagementApi = userManagementApi as jest.Mocked<typeof userManagementApi>;

// Mock data
const mockRoleTemplates = [
  {
    id: '1',
    name: 'Admin',
    description: 'Full administrative access',
    permissions: ['user:view', 'user:create', 'user:edit', 'user:delete'],
    isDefault: true,
    level: 0,
    usageCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Moderator',
    description: 'Moderation capabilities',
    permissions: ['user:view', 'user:ban'],
    isDefault: false,
    parentRoleId: '1',
    level: 1,
    usageCount: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockRoleHierarchy = {
  roles: mockRoleTemplates,
  hierarchy: {
    '1': ['2'],
    '2': []
  }
};

const mockRoleStats = {
  roleUsage: [
    { roleId: '1', roleName: 'Admin', userCount: 5 },
    { roleId: '2', roleName: 'Moderator', userCount: 3 }
  ],
  permissionUsage: [
    { permission: 'user:view', userCount: 8, roleCount: 2 },
    { permission: 'user:create', userCount: 5, roleCount: 1 }
  ],
  orphanedUsers: 0,
  duplicatePermissions: []
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  const theme = createTheme();

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('RoleTemplateManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserManagementApi.getRoleTemplates.mockResolvedValue(mockRoleTemplates);
    mockUserManagementApi.getRoleHierarchy.mockResolvedValue(mockRoleHierarchy);
    mockUserManagementApi.getRoleUsageStatistics.mockResolvedValue(mockRoleStats);
  });

  it('renders role template manager with statistics', async () => {
    render(<RoleTemplateManager />, { wrapper: createWrapper() });

    // Check if the component title is rendered
    expect(screen.getByText('Role Template Management')).toBeInTheDocument();

    // Wait for data to load and check statistics cards
    await waitFor(() => {
      expect(screen.getByText('Total Roles')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total roles count
    });

    expect(screen.getByText('Active Permissions')).toBeInTheDocument();
    expect(screen.getByText('Orphaned Users')).toBeInTheDocument();
    expect(screen.getByText('Duplicate Permissions')).toBeInTheDocument();
  });

  it('displays role templates in data grid', async () => {
    render(<RoleTemplateManager />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Moderator')).toBeInTheDocument();
    });

    // Check role details
    expect(screen.getByText('Full administrative access')).toBeInTheDocument();
    expect(screen.getByText('Moderation capabilities')).toBeInTheDocument();
  });

  it('opens create role dialog when create button is clicked', async () => {
    render(<RoleTemplateManager />, { wrapper: createWrapper() });

    const createButton = screen.getByText('Create Role Template');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create Role Template')).toBeInTheDocument();
      expect(screen.getByLabelText('Role Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });
  });

  it('switches between grid and hierarchy view', async () => {
    render(<RoleTemplateManager />, { wrapper: createWrapper() });

    // Find and click the hierarchy view switch
    const hierarchySwitch = screen.getByRole('checkbox', { name: /hierarchy view/i });
    fireEvent.click(hierarchySwitch);

    await waitFor(() => {
      expect(screen.getByText('Role Hierarchy')).toBeInTheDocument();
    });
  });

  it('creates a new role template', async () => {
    mockUserManagementApi.createRoleTemplate.mockResolvedValue({
      id: '3',
      name: 'Test Role',
      description: 'Test description',
      permissions: ['user:view'],
      isDefault: false,
      level: 0,
      usageCount: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    });

    render(<RoleTemplateManager />, { wrapper: createWrapper() });

    // Open create dialog
    const createButton = screen.getByText('Create Role Template');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Role Name')).toBeInTheDocument();
    });

    // Fill form
    const nameInput = screen.getByLabelText('Role Name');
    const descriptionInput = screen.getByLabelText('Description');
    
    fireEvent.change(nameInput, { target: { value: 'Test Role' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create role/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUserManagementApi.createRoleTemplate).toHaveBeenCalledWith({
        name: 'Test Role',
        description: 'Test description',
        permissions: [],
        isDefault: false
      });
    });
  });

  it('handles role deletion with usage validation', async () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    render(<RoleTemplateManager />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    // Try to delete a role with users (should show warning)
    const deleteButtons = screen.getAllByLabelText('Delete');
    fireEvent.click(deleteButtons[0]); // Admin role with 5 users

    // Should show warning message instead of deleting
    await waitFor(() => {
      expect(screen.getByText(/Cannot delete role "Admin"/)).toBeInTheDocument();
    });

    // Restore window.confirm
    window.confirm = originalConfirm;
  });

  it('duplicates a role template', async () => {
    // Mock window.prompt
    const originalPrompt = window.prompt;
    window.prompt = jest.fn(() => 'Admin (Copy)');

    mockUserManagementApi.duplicateRoleTemplate.mockResolvedValue({
      id: '3',
      name: 'Admin (Copy)',
      description: 'Full administrative access',
      permissions: ['user:view', 'user:create', 'user:edit', 'user:delete'],
      isDefault: false,
      level: 0,
      usageCount: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    });

    render(<RoleTemplateManager />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    // Click duplicate button
    const duplicateButtons = screen.getAllByLabelText('Duplicate');
    fireEvent.click(duplicateButtons[0]);

    await waitFor(() => {
      expect(mockUserManagementApi.duplicateRoleTemplate).toHaveBeenCalledWith({
        id: '1',
        newName: 'Admin (Copy)'
      });
    });

    // Restore window.prompt
    window.prompt = originalPrompt;
  });

  it('displays role hierarchy correctly', async () => {
    render(<RoleTemplateManager />, { wrapper: createWrapper() });

    // Switch to hierarchy view
    const hierarchySwitch = screen.getByRole('checkbox', { name: /hierarchy view/i });
    fireEvent.click(hierarchySwitch);

    await waitFor(() => {
      expect(screen.getByText('Role Hierarchy')).toBeInTheDocument();
      // Admin should be at root level
      expect(screen.getByText('Admin')).toBeInTheDocument();
      // Moderator should be under Admin
      expect(screen.getByText('Moderator')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockUserManagementApi.getRoleTemplates.mockRejectedValue(new Error('API Error'));

    render(<RoleTemplateManager />, { wrapper: createWrapper() });

    // Component should still render even with API error
    expect(screen.getByText('Role Template Management')).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    render(<RoleTemplateManager />, { wrapper: createWrapper() });

    // Open create dialog
    const createButton = screen.getByText('Create Role Template');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Role Name')).toBeInTheDocument();
    });

    // Try to submit without required fields
    const submitButton = screen.getByRole('button', { name: /create role/i });
    expect(submitButton).toBeDisabled(); // Should be disabled without name
  });
});