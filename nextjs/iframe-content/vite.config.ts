import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import path from 'node:path'
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
    port: 5178,
    open: false,
    cors: true,
  },
  publicDir: false,
  // Use standard npm package import (no local alias)
  // Exclude @spatialwalk/avatarkit from pre-bundling to allow WASM files to load correctly from node_modules
  optimizeDeps: {
    exclude: ['@spatialwalk/avatarkit'],
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'demo.html'),
      },
    },
  },
})
