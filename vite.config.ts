import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/gutenberg': {
        target: 'https://www.gutenberg.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gutenberg/, ''),
      },
      '/classics': {
        target: 'https://classics.mit.edu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/classics/, ''),
      },
    },
  },
})
