import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { AutoImportDeps } from './config/autoImport'
import { AutoRegistryComponents } from './config/autoRegistryComponents'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), AutoImportDeps(), AutoRegistryComponents()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/v1': {
        target: 'https://tgdd-api.jx3kaihe.top',
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/v1/, ""),
      },
    },
  },
})
