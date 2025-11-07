import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
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
    port: 5174,
    open: true,
  },
  publicDir: false,
  // Exclude @spatialwalk/avatarkit from pre-bundling to allow WASM files to load correctly from node_modules
  optimizeDeps: {
    exclude: ['@spatialwalk/avatarkit'],
  },
  // Mark WASM files as static assets
  assetsInclude: ['**/*.wasm'],
})
