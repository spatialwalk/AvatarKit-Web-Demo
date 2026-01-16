import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { defineConfig } from 'vite'
import { avatarkitVitePlugin } from '@spatialwalk/avatarkit/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    // Use SDK's Vite plugin to automatically handle WASM configuration
    // This plugin automatically:
    // - Sets correct MIME type for WASM files in dev server
    // - Copies WASM files to dist/assets/ during build
    // - Generates _headers file for Cloudflare Pages
    // - Configures optimizeDeps, assetsInclude, and assetsInlineLimit
    avatarkitVitePlugin(),
  ],
  root: __dirname,
  server: {
    port: 5174,
    open: true,
  },
  publicDir: false,
})
