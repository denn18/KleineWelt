import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:2000';


  return {
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/health': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/uploads': { target: backendUrl, changeOrigin: true },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/tests/setupTests.js',
    },
  };
});
