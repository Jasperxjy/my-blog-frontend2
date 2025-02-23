import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 4000,
    strictPort: true, // 添加此选项
    open: true,
    proxy: {
      '/api': {
        target: 'http://47.108.171.144:80',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
})
