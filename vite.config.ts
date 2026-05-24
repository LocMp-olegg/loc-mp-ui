import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/hubs/chat': {
        target: 'http://localhost:5007',
        ws: true,
        changeOrigin: true,
      },
      '/hubs/notifications': {
        target: 'http://localhost:5005',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
