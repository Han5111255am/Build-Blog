import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Unocss from '@unocss/vite'

export default defineConfig({
  plugins: [vue(), Unocss()],
  ssgOptions: {
    dirStyle: 'nested',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/sitemap.xml': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
      '/robots.txt': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
      '/rss.xml': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
      '/feed.xml': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
})
