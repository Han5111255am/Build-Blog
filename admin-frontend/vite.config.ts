import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, './src') },
        { find: /^react\/jsx-dev-runtime$/, replacement: path.resolve(__dirname, './node_modules/react/jsx-dev-runtime.js') },
        { find: /^react\/jsx-runtime$/, replacement: path.resolve(__dirname, './node_modules/react/jsx-runtime.js') },
        { find: /^react-dom\/client$/, replacement: path.resolve(__dirname, './node_modules/react-dom/client.js') },
        { find: /^react$/, replacement: path.resolve(__dirname, './node_modules/react/index.js') },
      ],
    },
    build: {
      // Avoid colliding with the SPA route `/assets` on static hosting.
      assetsDir: '_static',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@tanstack/react-query')) {
                return 'query-vendor'
              }

              if (id.includes('@tanstack/react-router')) {
                return 'router-vendor'
              }

              if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
                return 'form-vendor'
              }

              return 'vendor'
            }
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      fs: {
        allow: [path.resolve(__dirname, '..')],
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
