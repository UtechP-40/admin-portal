
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { MotionConfig } from 'framer-motion';
import { router } from './router';
import { queryClient } from './services/queryClient';
import { lightMuiTheme, darkMuiTheme } from './theme';
import { useThemeMode } from './hooks/useThemeMode';
import ErrorBoundary from './components/common/ErrorBoundary';
import SessionManager from './components/common/SessionManager';

function App() {
  const { effectiveTheme } = useThemeMode();
  const theme = effectiveTheme === 'dark' ? darkMuiTheme : lightMuiTheme;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <MotionConfig reducedMotion="user">
            <RouterProvider router={router} />
            <SessionManager />
          </MotionConfig>
        </ThemeProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
