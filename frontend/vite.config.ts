import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      // Targeted discovery — this ensures Vite follows the config for your /src app
      projects: ['./tsconfig.app.json'],
      logFile: true // Generates vite-tsconfig-paths.log for debugging if it still fails
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})