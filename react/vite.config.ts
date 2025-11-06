import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    // 确保 WASM 文件使用正确的 MIME 类型
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
    port: 5176,
    open: true,
  },
  // 使用标准的 npm 包导入
  resolve: {
    alias: {
      '@': __dirname + '/src',
    },
  },
  // 排除 @spatialwalk/avatarkit 的预构建，让 WASM 文件从 node_modules 正确加载
  optimizeDeps: {
    exclude: ['@spatialwalk/avatarkit'],
  },
  // 将 WASM 文件标记为静态资源
  assetsInclude: ['**/*.wasm'],
})

