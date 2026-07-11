import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    // Disabilita source maps in produzione per non esporre il codice sorgente (VUL-009)
    sourcemap: mode !== 'production',
  },
  test: {
    globals: true,
  },
}))
