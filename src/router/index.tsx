import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import {
  LoginPage,
  RegisterPage,
  PasswordResetPage,
  DashboardPage,
  DatabasePage,
  AnalyticsPage,
  MonitoringPage,
  SettingsPage,
  TestingPage,
} from '../pages';
import UserManagementPage from '../pages/UserManagementPage';
import SystemConfigurationPage from '../pages/SystemConfigurationPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/password-reset',
    element: <PasswordResetPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'database',
        element: <DatabasePage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'monitoring',
        element: <MonitoringPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'testing',
        element: <TestingPage />,
      },
      {
        path: 'user-management',
        element: <UserManagementPage />,
      },
      {
        path: 'system-configuration',
        element: <SystemConfigurationPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
