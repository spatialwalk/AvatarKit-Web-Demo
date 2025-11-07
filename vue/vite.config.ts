import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    // Ensure WASM files use correct MIME type
    {
      name: 'configure-wasm-mime',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm')
          }
          next()
        })
      },
    },
  ],
  root: __dirname,
  server: {
    port: 5175,
    open: true,
  },
  // Use standard npm package import
  resolve: {
    alias: {
      '@': __dirname + '/src',
    },
  },
  // Exclude @spatialwalk/avatarkit from pre-bundling to allow WASM files to load correctly from node_modules
  optimizeDeps: {
    exclude: ['@spatialwalk/avatarkit'],
  },
  // Mark WASM files as static assets
  assetsInclude: ['**/*.wasm'],
})

