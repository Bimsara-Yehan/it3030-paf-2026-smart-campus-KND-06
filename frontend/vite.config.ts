import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  // Path alias — allows importing from '@/components/...' 
  // instead of '../../components/...'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Proxy API requests to Spring Boot backend during development
  // Requests to /api/v1/... are forwarded to localhost:8080
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})