import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Storage as DatabaseIcon,
  Analytics as AnalyticsIcon,
  Monitor as MonitoringIcon,
  Settings as SettingsIcon,
  BugReport as TestingIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  People as PeopleIcon,
  Tune as TuneIcon,
  Build as MaintenanceIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 64;

const menuItems = [
  { 
    path: '/dashboard', 
    label: 'Dashboard', 
    icon: <DashboardIcon />,
    badge: null,
  },
  { 
    path: '/user-management', 
    label: 'User Management', 
    icon: <PeopleIcon />,
    badge: null,
  },
  { 
    path: '/system-configuration', 
    label: 'System Config', 
    icon: <TuneIcon />,
    badge: null,
  },
  { 
    path: '/database', 
    label: 'Database', 
    icon: <DatabaseIcon />,
    badge: null,
  },
  { 
    path: '/analytics', 
    label: 'Analytics', 
    icon: <AnalyticsIcon />,
    badge: null,
  },
  { 
    path: '/monitoring', 
    label: 'Monitoring', 
    icon: <MonitoringIcon />,
    badge: 2, // Example: 2 active alerts
  },
  { 
    path: '/security', 
    label: 'Security', 
    icon: <SecurityIcon />,
    badge: null,
  },
  { 
    path: '/testing', 
    label: 'API Testing', 
    icon: <TestingIcon />,
    badge: null,
  },
  { 
    path: '/settings', 
    label: 'Settings', 
    icon: <SettingsIcon />,
    badge: null,
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobile,
  mobileOpen,
  onMobileToggle,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const drawerWidth = isCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onMobileToggle();
    }
  };

  const drawerContent = (
    <>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          minHeight: 64,
        }}
      >
        {!isCollapsed && (
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Admin Portal
          </Typography>
        )}
        {!isMobile && (
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            sx={{
              ml: isCollapsed ? 0 : 'auto',
            }}
          >
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <Tooltip
              title={isCollapsed ? item.label : ''}
              placement="right"
              arrow
            >
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: isCollapsed ? 'center' : 'initial',
                  px: 2.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isCollapsed ? 0 : 3,
                    justifyContent: 'center',
                  }}
                >
                  {item.badge && !isCollapsed ? (
                    <Badge badgeContent={item.badge} color="error" variant="dot">
                      {item.icon}
                    </Badge>
                  ) : item.badge && isCollapsed ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{item.label}</span>
                        {item.badge && (
                          <Badge badgeContent={item.badge} color="error" size="small" />
                        )}
                      </Box>
                    } 
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
