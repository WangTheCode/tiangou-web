import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { AutoImportDeps } from './config/autoImport.js'
import { AutoRegistryComponents } from './config/autoRegistryComponents.js'

export default defineConfig({
  base: './',
  plugins: [vue(), vueJsx(), AutoImportDeps(), AutoRegistryComponents()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@global': fileURLToPath(new URL('../global', import.meta.url)),
    },
  },
  build: {
    outDir: 'tiangou-pc-dist',
    assetsDir: 'assets',
    minify: false,
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
