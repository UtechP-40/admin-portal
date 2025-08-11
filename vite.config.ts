import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/admin/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/x-data-grid',
      '@mui/x-charts',
      '@tanstack/react-query',
      'axios',
      'socket.io-client',
      'recharts',
      'framer-motion',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/x-data-grid', '@mui/x-charts'],
          utils: ['axios', '@tanstack/react-query', 'socket.io-client'],
        },
      },
    },
  },
  define: {
    global: 'globalThis',
  },
})
