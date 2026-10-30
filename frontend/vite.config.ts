import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('smiles-drawer')) {
              return 'smiles';
            }
            return 'deps';
          }
        }
      }
    }
  }
})
