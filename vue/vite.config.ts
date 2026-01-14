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
    // Ensure WASM files use correct MIME type in development
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
    // Note: SDK requires fixed path /assets/avatar_core_wasm.wasm, so we manually copy it
    {
      name: 'copy-wasm-file',
      closeBundle() {
        const wasmSource = join(__dirname, 'node_modules/@spatialwalk/avatarkit/dist/avatar_core_wasm.wasm')
        const wasmDest = join(__dirname, 'dist/assets/avatar_core_wasm.wasm')
        const headersDest = join(__dirname, 'dist/_headers')
        
        if (existsSync(wasmSource)) {
          copyFileSync(wasmSource, wasmDest)
          console.log('✅ Copied WASM file to dist/assets/avatar_core_wasm.wasm')
        } else {
          console.warn('⚠️ WASM file not found at:', wasmSource)
        }
        
        // Create _headers file for Cloudflare Pages and similar platforms
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
  // Mark WASM files as static assets (prevents Vite from trying to process them as modules)
  assetsInclude: ['**/*.wasm'],
  build: {
    // Ensure WASM files are not inlined as base64 (they must be separate files)
    assetsInlineLimit: 0, // Disable inlining for all assets, or set a small value like 4096
    rollupOptions: {
      output: {
        // Customize asset file naming to ensure WASM files have predictable names
        assetFileNames: (assetInfo) => {
          // Keep WASM files with fixed name (SDK requires /assets/avatar_core_wasm.wasm)
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'assets/[name][extname]'
          }
          // Other assets can use hash for cache busting
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})

