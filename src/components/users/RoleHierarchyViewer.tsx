import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TreeView,
  TreeItem,
  Alert,
  Grid,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  AccountTree as HierarchyIcon,
  Person as PersonIcon,
  VpnKey as PermissionIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ArrowDownward as InheritedIcon,
  ArrowUpward as DirectIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { userManagementApi, RoleTemplate } from '../../services/userManagementApi';
import { PERMISSION_DESCRIPTIONS } from '../../types/permissions';

interface RoleHierarchyViewerProps {
  open: boolean;
  onClose: () => void;
  selectedRole?: RoleTemplate;
}

interface EffectivePermissions {
  directPermissions: string[];
  inheritedPermissions: string[];
  effectivePermissions: string[];
  inheritancePath: string[];
}

const RoleHierarchyViewer: React.FC<RoleHierarchyViewerProps> = ({
  open,
  onClose,
  selectedRole
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(selectedRole?.id || null);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);

  // Fetch role hierarchy
  const { data: roleHierarchy } = useQuery({
    queryKey: ['roleHierarchy'],
    queryFn: () => userManagementApi.getRoleHierarchy(),
    enabled: open
  });

  // Fetch effective permissions for selected role
  const { data: effectivePermissions } = useQuery({
    queryKey: ['effectivePermissions', selectedRoleId],
    queryFn: () => selectedRoleId ? userManagementApi.getEffectivePermissions(selectedRoleId) : null,
    enabled: !!selectedRoleId && open
  });

  // Fetch users for selected role
  const { data: roleUsers } = useQuery({
    queryKey: ['roleUsers', selectedRoleId],
    queryFn: () => selectedRoleId ? userManagementApi.getUsersByRole(selectedRoleId) : [],
    enabled: !!selectedRoleId && open
  });

  useEffect(() => {
    if (selectedRole) {
      setSelectedRoleId(selectedRole.id);
      setExpandedNodes([selectedRole.id]);
    }
  }, [selectedRole]);

  const buildTreeItems = (roleId: string, level = 0): React.ReactNode => {
    if (!roleHierarchy) return null;

    const role = roleHierarchy.roles.find(r => r.id === roleId);
    if (!role) return null;

    const children = roleHierarchy.hierarchy[roleId] || [];
    const isSelected = selectedRoleId === roleId;

    return (
      <TreeItem
        key={roleId}
        nodeId={roleId}
        label={
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              py: 1,
              backgroundColor: isSelected ? 'primary.light' : 'transparent',
              borderRadius: 1,
              px: 1
            }}
            onClick={() => setSelectedRoleId(roleId)}
          >
            <SecurityIcon color={isSelected ? 'primary' : 'inherit'} />
            <Typography 
              variant="body2" 
              fontWeight={isSelected ? 'bold' : 'normal'}
            >
              {role.name}
            </Typography>
            <Chip 
              label={`L${role.level}`} 
              size="small" 
              color={level === 0 ? 'primary' : 'default'} 
            />
            <Chip 
              label={`${role.permissions.length} perms`} 
              size="small" 
              variant="outlined" 
            />
            <Chip 
              label={`${role.usageCount} users`} 
              size="small" 
              color="secondary" 
            />
            {role.isDefault && (
              <Chip label="Default" size="small" color="primary" />
            )}
          </Box>
        }
      >
        {children.map(childId => buildTreeItems(childId, level + 1))}
      </TreeItem>
    );
  };

  const renderRoleDetails = () => {
    if (!selectedRoleId || !roleHierarchy) return null;

    const role = roleHierarchy.roles.find(r => r.id === selectedRoleId);
    if (!role) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Role Details: {role.name}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Basic Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Description"
                      secondary={role.description || 'No description'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Level"
                      secondary={role.level}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Users Assigned"
                      secondary={role.usageCount}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Default Role"
                      secondary={role.isDefault ? 'Yes' : 'No'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Created"
                      secondary={new Date(role.createdAt).toLocaleDateString()}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Hierarchy Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Parent Role"
                      secondary={
                        role.parentRoleId ? 
                          roleHierarchy.roles.find(r => r.id === role.parentRoleId)?.name || 'Unknown' :
                          'None (Root Role)'
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Child Roles"
                      secondary={
                        roleHierarchy.hierarchy[role.id]?.length || 0
                      }
                    />
                  </ListItem>
                  {effectivePermissions && (
                    <>
                      <ListItem>
                        <ListItemText
                          primary="Direct Permissions"
                          secondary={effectivePermissions.directPermissions.length}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Inherited Permissions"
                          secondary={effectivePermissions.inheritedPermissions.length}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Total Effective Permissions"
                          secondary={effectivePermissions.effectivePermissions.length}
                        />
                      </ListItem>
                    </>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {effectivePermissions && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Permission Analysis
            </Typography>
            
            {effectivePermissions.inheritancePath.length > 1 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Inheritance Path
                </Typography>
                <Breadcrumbs>
                  {effectivePermissions.inheritancePath.map((roleId, index) => {
                    const pathRole = roleHierarchy.roles.find(r => r.id === roleId);
                    return (
                      <Link
                        key={roleId}
                        component="button"
                        variant="body2"
                        onClick={() => setSelectedRoleId(roleId)}
                        color={roleId === selectedRoleId ? 'primary' : 'inherit'}
                      >
                        {pathRole?.name || 'Unknown'}
                      </Link>
                    );
                  })}
                </Breadcrumbs>
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DirectIcon color="primary" />
                      <Typography>
                        Direct Permissions ({effectivePermissions.directPermissions.length})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {effectivePermissions.directPermissions.map((permission) => (
                        <ListItem key={permission}>
                          <ListItemIcon>
                            <PermissionIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={permission}
                            secondary={PERMISSION_DESCRIPTIONS[permission as keyof typeof PERMISSION_DESCRIPTIONS]}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              <Grid item xs={12} md={4}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InheritedIcon color="secondary" />
                      <Typography>
                        Inherited Permissions ({effectivePermissions.inheritedPermissions.length})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {effectivePermissions.inheritedPermissions.map((permission) => (
                        <ListItem key={permission}>
                          <ListItemIcon>
                            <PermissionIcon color="secondary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={permission}
                            secondary={PERMISSION_DESCRIPTIONS[permission as keyof typeof PERMISSION_DESCRIPTIONS]}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              <Grid item xs={12} md={4}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" />
                      <Typography>
                        All Effective Permissions ({effectivePermissions.effectivePermissions.length})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {effectivePermissions.effectivePermissions.map((permission) => {
                        const isDirect = effectivePermissions.directPermissions.includes(permission);
                        const isInherited = effectivePermissions.inheritedPermissions.includes(permission);
                        
                        return (
                          <ListItem key={permission}>
                            <ListItemIcon>
                              <PermissionIcon 
                                color={isDirect ? 'primary' : 'secondary'} 
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2">{permission}</Typography>
                                  {isDirect && (
                                    <Chip label="Direct" size="small" color="primary" />
                                  )}
                                  {isInherited && (
                                    <Chip label="Inherited" size="small" color="secondary" />
                                  )}
                                </Box>
                              }
                              secondary={PERMISSION_DESCRIPTIONS[permission as keyof typeof PERMISSION_DESCRIPTIONS]}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </Box>
        )}

        {roleUsers && roleUsers.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Users with this Role ({roleUsers.length})
            </Typography>
            <List>
              {roleUsers.slice(0, 10).map((user) => (
                <ListItem key={user.id}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={user.fullName}
                    secondary={
                      <Box>
                        <Typography variant="body2">{user.email}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Status: {user.status} | Last Login: {
                            user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
                          }
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {roleUsers.length > 10 && (
                <ListItem>
                  <ListItemText
                    primary={`... and ${roleUsers.length - 10} more users`}
                    sx={{ textAlign: 'center', fontStyle: 'italic' }}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        )}
      </Box>
    );
  };

  const renderHierarchyTree = () => {
    if (!roleHierarchy) return null;

    const rootRoles = roleHierarchy.roles.filter(r => !r.parentRoleId);

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Role Hierarchy
        </Typography>
        <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
          <TreeView
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<SecurityIcon />}
            expanded={expandedNodes}
            onNodeToggle={(event, nodeIds) => setExpandedNodes(nodeIds)}
          >
            {rootRoles.map(role => buildTreeItems(role.id))}
          </TreeView>
        </Paper>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HierarchyIcon />
          Role Hierarchy Viewer
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {renderHierarchyTree()}
          </Grid>
          <Grid item xs={12} md={8}>
            {selectedRoleId ? (
              renderRoleDetails()
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: 300,
                color: 'text.secondary'
              }}>
                <SecurityIcon sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6">
                  Select a role from the hierarchy to view details
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleHierarchyViewer;