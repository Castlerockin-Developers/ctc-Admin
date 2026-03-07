import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation': ['framer-motion'],
          'editor': ['react-quill', 'quill'],
          'export': ['xlsx', 'jspdf', 'file-saver'],
          'ui': ['sweetalert2', '@fortawesome/react-fontawesome'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})