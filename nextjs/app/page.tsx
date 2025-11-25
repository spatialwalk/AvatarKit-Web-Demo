'use client'

import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  // Iframe content URL
  // Development: Use Vite dev server for hot reload (http://localhost:5178/demo.html)
  // Production: Use static files from Next.js public directory (/iframe/demo.html)
  const iframeSrc = process.env.NEXT_PUBLIC_IFRAME_URL || 
    (process.env.NODE_ENV === 'production' ? '/iframe/demo.html' : 'http://localhost:5178/demo.html')

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security (in production, verify the actual origin)
      // if (event.origin !== 'http://localhost:5178') return

      console.log('Message from iframe:', event.data)
      
      // Handle messages from iframe
      // You can extend this to control the SDK from Next.js app
      if (event.data.type === 'sdk-ready') {
        console.log('SDK in iframe is ready')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleIframeLoad = () => {
    setIframeLoaded(true)
    // Send initial message to iframe if needed
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'parent-ready' },
      '*'
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🚀 SPAvatar SDK - Next.js iframe Example</h1>
        <p>使用 iframe 方式集成 SDK，避免 WASM 打包兼容性问题</p>
      </div>

      <div className="content">
        <div className="info-box">
          <h3>💡 为什么使用 iframe 方案？</h3>
          <p>
            由于 Vite 打包的 WASM 文件和 Next.js 的 webpack 配置不兼容，
            直接在 Next.js 中集成 SDK 会遇到打包问题。使用 iframe 方案可以：
          </p>
          <ul>
            <li>✅ 完全隔离 SDK 的运行环境，避免打包配置冲突</li>
            <li>✅ SDK 在独立的 Vite 应用中运行，无需特殊配置</li>
            <li>✅ Next.js 应用保持简洁，不包含 SDK 相关代码</li>
            <li>✅ 通过 postMessage 实现跨框架通信</li>
          </ul>
        </div>

        <div className="iframe-container">
          <div className="iframe-wrapper">
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              className="iframe-content"
              title="SPAvatar SDK Demo"
              onLoad={handleIframeLoad}
              allow="microphone; camera"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

