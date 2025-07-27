
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { MotionConfig } from 'framer-motion';
import { router } from './router';
import { queryClient } from './services/queryClient';
import { lightMuiTheme } from './theme';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={lightMuiTheme}>
        <CssBaseline />
        <MotionConfig reducedMotion="user">
          <RouterProvider router={router} />
        </MotionConfig>
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
