import { RoleTemplate } from '../services/userManagementApi';
import { ROLE_PERMISSIONS } from '../types/permissions';
import type { Permission, Role } from '../types/permissions';

/**
 * Utility functions for role and permission management
 */

/**
 * Calculate effective permissions for a role including inheritance
 */
export const calculateEffectivePermissions = (
  role: RoleTemplate,
  allRoles: RoleTemplate[]
): {
  directPermissions: string[];
  inheritedPermissions: string[];
  effectivePermissions: string[];
  inheritancePath: string[];
} => {
  const visited = new Set<string>();
  const inheritancePath: string[] = [];
  const inheritedPermissions = new Set<string>();

  const collectInheritedPermissions = (roleId: string) => {
    if (visited.has(roleId)) {
      // Circular dependency detected
      return;
    }

    visited.add(roleId);
    const currentRole = allRoles.find(r => r.id === roleId);
    
    if (!currentRole) return;

    inheritancePath.push(roleId);

    if (currentRole.parentRoleId) {
      const parentRole = allRoles.find(r => r.id === currentRole.parentRoleId);
      if (parentRole) {
        // Add parent's permissions as inherited
        parentRole.permissions.forEach(perm => inheritedPermissions.add(perm));
        // Recursively collect from parent
        collectInheritedPermissions(currentRole.parentRoleId);
      }
    }
  };

  collectInheritedPermissions(role.id);

  const directPermissions = [...role.permissions];
  const inheritedPerms = Array.from(inheritedPermissions);
  const effectivePermissions = Array.from(new Set([...directPermissions, ...inheritedPerms]));

  return {
    directPermissions,
    inheritedPermissions: inheritedPerms,
    effectivePermissions,
    inheritancePath
  };
};

/**
 * Validate role hierarchy to prevent circular dependencies
 */
export const validateRoleHierarchy = (
  parentRoleId: string,
  childRoleId: string,
  allRoles: RoleTemplate[]
): {
  isValid: boolean;
  wouldCreateCycle: boolean;
  conflictingPermissions: string[];
} => {
  // Check if assigning parentRoleId as parent to childRoleId would create a cycle
  const visited = new Set<string>();
  
  const hasCycle = (roleId: string, targetId: string): boolean => {
    if (roleId === targetId) return true;
    if (visited.has(roleId)) return false;
    
    visited.add(roleId);
    const role = allRoles.find(r => r.id === roleId);
    
    if (role?.parentRoleId) {
      return hasCycle(role.parentRoleId, targetId);
    }
    
    return false;
  };

  const wouldCreateCycle = hasCycle(parentRoleId, childRoleId);

  // Check for conflicting permissions (permissions that would be duplicated)
  const parentRole = allRoles.find(r => r.id === parentRoleId);
  const childRole = allRoles.find(r => r.id === childRoleId);
  
  const conflictingPermissions: string[] = [];
  if (parentRole && childRole) {
    conflictingPermissions.push(
      ...parentRole.permissions.filter(perm => childRole.permissions.includes(perm))
    );
  }

  return {
    isValid: !wouldCreateCycle,
    wouldCreateCycle,
    conflictingPermissions
  };
};

/**
 * Build role hierarchy tree structure
 */
export const buildRoleHierarchy = (roles: RoleTemplate[]): {
  hierarchy: { [key: string]: string[] };
  levels: { [key: string]: number };
} => {
  const hierarchy: { [key: string]: string[] } = {};
  const levels: { [key: string]: number } = {};

  // Initialize hierarchy
  roles.forEach(role => {
    hierarchy[role.id] = [];
  });

  // Build parent-child relationships
  roles.forEach(role => {
    if (role.parentRoleId && hierarchy[role.parentRoleId]) {
      hierarchy[role.parentRoleId].push(role.id);
    }
  });

  // Calculate levels
  const calculateLevel = (roleId: string, visited = new Set<string>()): number => {
    if (visited.has(roleId)) return 0; // Circular dependency
    if (levels[roleId] !== undefined) return levels[roleId];

    visited.add(roleId);
    const role = roles.find(r => r.id === roleId);
    
    if (!role || !role.parentRoleId) {
      levels[roleId] = 0;
    } else {
      levels[roleId] = calculateLevel(role.parentRoleId, visited) + 1;
    }

    visited.delete(roleId);
    return levels[roleId];
  };

  roles.forEach(role => {
    calculateLevel(role.id);
  });

  return { hierarchy, levels };
};

/**
 * Get role suggestions based on permissions
 */
export const suggestRolesForPermissions = (
  permissions: string[],
  allRoles: RoleTemplate[]
): RoleTemplate[] => {
  return allRoles
    .map(role => {
      const effective = calculateEffectivePermissions(role, allRoles);
      const matchingPermissions = permissions.filter(perm => 
        effective.effectivePermissions.includes(perm)
      );
      
      return {
        role,
        matchScore: matchingPermissions.length / permissions.length,
        matchingPermissions
      };
    })
    .filter(item => item.matchScore > 0.5) // At least 50% match
    .sort((a, b) => b.matchScore - a.matchScore)
    .map(item => item.role);
};

/**
 * Optimize role assignments by removing redundant permissions
 */
export const optimizeUserPermissions = (
  userPermissions: string[],
  assignedRoles: RoleTemplate[],
  allRoles: RoleTemplate[]
): {
  optimizedPermissions: string[];
  redundantPermissions: string[];
  suggestedRoles: RoleTemplate[];
} => {
  // Calculate all permissions from assigned roles
  const rolePermissions = new Set<string>();
  assignedRoles.forEach(role => {
    const effective = calculateEffectivePermissions(role, allRoles);
    effective.effectivePermissions.forEach(perm => rolePermissions.add(perm));
  });

  // Find redundant permissions (already covered by roles)
  const redundantPermissions = userPermissions.filter(perm => rolePermissions.has(perm));
  const optimizedPermissions = userPermissions.filter(perm => !rolePermissions.has(perm));

  // Suggest roles for remaining permissions
  const suggestedRoles = suggestRolesForPermissions(optimizedPermissions, allRoles);

  return {
    optimizedPermissions,
    redundantPermissions,
    suggestedRoles
  };
};

/**
 * Generate role template from predefined role enum
 */
export const generateRoleTemplateFromEnum = (role: Role): Partial<RoleTemplate> => {
  return {
    name: role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    description: `Auto-generated template for ${role} role`,
    permissions: ROLE_PERMISSIONS[role] || [],
    isDefault: true,
    level: 0
  };
};

/**
 * Validate permission assignment
 */
export const validatePermissionAssignment = (
  permissions: string[],
  userRoles: RoleTemplate[],
  allRoles: RoleTemplate[]
): {
  isValid: boolean;
  conflicts: string[];
  suggestions: string[];
} => {
  const conflicts: string[] = [];
  const suggestions: string[] = [];

  // Check for conflicts with role permissions
  userRoles.forEach(role => {
    const effective = calculateEffectivePermissions(role, allRoles);
    const conflictingPerms = permissions.filter(perm => 
      effective.effectivePermissions.includes(perm)
    );
    conflicts.push(...conflictingPerms);
  });

  // Suggest removing redundant permissions
  if (conflicts.length > 0) {
    suggestions.push(`Remove ${conflicts.length} permissions already granted by assigned roles`);
  }

  // Suggest role assignments for remaining permissions
  const remainingPermissions = permissions.filter(perm => !conflicts.includes(perm));
  if (remainingPermissions.length > 0) {
    const suggestedRoles = suggestRolesForPermissions(remainingPermissions, allRoles);
    if (suggestedRoles.length > 0) {
      suggestions.push(`Consider assigning role "${suggestedRoles[0].name}" instead of individual permissions`);
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts: Array.from(new Set(conflicts)),
    suggestions
  };
};

/**
 * Export role template data for backup/migration
 */
export const exportRoleTemplates = (roles: RoleTemplate[]): string => {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    roles: roles.map(role => ({
      ...role,
      // Remove runtime fields
      usageCount: undefined,
      createdAt: undefined,
      updatedAt: undefined
    }))
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Import and validate role template data
 */
export const importRoleTemplates = (
  jsonData: string,
  existingRoles: RoleTemplate[]
): {
  isValid: boolean;
  roles: Partial<RoleTemplate>[];
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const importData = JSON.parse(jsonData);
    
    if (!importData.roles || !Array.isArray(importData.roles)) {
      errors.push('Invalid format: roles array not found');
      return { isValid: false, roles: [], errors, warnings };
    }

    const roles: Partial<RoleTemplate>[] = [];

    importData.roles.forEach((role: any, index: number) => {
      // Validate required fields
      if (!role.name) {
        errors.push(`Role ${index + 1}: name is required`);
        return;
      }

      if (!role.permissions || !Array.isArray(role.permissions)) {
        errors.push(`Role ${index + 1}: permissions array is required`);
        return;
      }

      // Check for name conflicts
      const existingRole = existingRoles.find(r => r.name === role.name);
      if (existingRole) {
        warnings.push(`Role "${role.name}" already exists and will be updated`);
      }

      // Validate permissions
      const validPermissions = Object.values(Permission);
      const invalidPermissions = role.permissions.filter((perm: string) => 
        !validPermissions.includes(perm as Permission)
      );
      
      if (invalidPermissions.length > 0) {
        warnings.push(`Role "${role.name}": invalid permissions - ${invalidPermissions.join(', ')}`);
      }

      roles.push({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions.filter((perm: string) => 
          validPermissions.includes(perm as Permission)
        ),
        parentRoleId: role.parentRoleId,
        isDefault: role.isDefault || false
      });
    });

    return {
      isValid: errors.length === 0,
      roles,
      errors,
      warnings
    };
  } catch (error) {
    errors.push(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, roles: [], errors, warnings };
  }
};