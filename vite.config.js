import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    open: false,
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.vercel/**',
        '**/vite.config.js.timestamp-*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      framer: path.resolve(__dirname, './node_modules/unframer/dist/framer.js'),
    },
  },
});
