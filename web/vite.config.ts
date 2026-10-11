import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// During local dev, proxy /api to the NestJS API so the frontend uses the same
// same-origin path it will use in production (through nginx).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: false },
});
