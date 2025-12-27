import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'

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
    // Copy WASM file to dist/assets after build
    {
      name: 'copy-wasm-file',
      closeBundle() {
        const wasmSource = join(__dirname, 'node_modules/@spatialwalk/avatarkit/dist/avatar_core_wasm.wasm')
        const wasmDest = join(__dirname, 'dist/assets/avatar_core_wasm.wasm')
        const headersDest = join(__dirname, 'dist/_headers')
        
        if (existsSync(wasmSource)) {
          copyFileSync(wasmSource, wasmDest)
          console.log('✅ Copied WASM file to dist/assets/')
        } else {
          console.warn('⚠️ WASM file not found at:', wasmSource)
        }
        
        // Create _headers file for Cloudflare Pages
        const headersContent = '/*.wasm\n  Content-Type: application/wasm\n'
        writeFileSync(headersDest, headersContent)
        console.log('✅ Created _headers file for Cloudflare Pages')
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

