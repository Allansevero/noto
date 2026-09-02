import path from "path"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/focus-api': {
        target: 'https://api.focusnfe.com.br',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/focus-api/, ''),
      },
      '/focus-homologacao-api': {
        target: 'https://homologacao.focusnfe.com.br',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/focus-homologacao-api/, ''),
      },
    },
  },
})
