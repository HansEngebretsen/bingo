import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/spooky-bingo/', // Use repository name for GitHub Pages subdirectory
  build: {
    outDir: 'dist'
  }
})