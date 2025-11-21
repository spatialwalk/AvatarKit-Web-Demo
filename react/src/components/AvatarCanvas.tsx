/**
 * Avatar Canvas container component
 */

import { forwardRef, useEffect, useRef, useState } from 'react'
import type { AvatarView } from '@spatialwalk/avatarkit'

interface AvatarCanvasProps {
  avatarView?: AvatarView | null
}

export const AvatarCanvas = forwardRef<HTMLDivElement, AvatarCanvasProps>((props, ref) => {
  const [fps, setFps] = useState<number | null>(null)
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationFrameIdRef = useRef<number | null>(null)

  // FPS monitoring
  useEffect(() => {
    const updateFPS = () => {
      frameCountRef.current++
      const currentTime = performance.now()
      const elapsed = currentTime - lastTimeRef.current

      if (elapsed >= 1000) {
        // 每秒更新一次FPS
        const newFps = Math.round((frameCountRef.current * 1000) / elapsed)
        setFps(newFps)
        frameCountRef.current = 0
        lastTimeRef.current = currentTime
      }

      animationFrameIdRef.current = requestAnimationFrame(updateFPS)
    }

    animationFrameIdRef.current = requestAnimationFrame(updateFPS)

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [])

  return (
    <div ref={ref} className="canvas-container">
      <div className="performance-display">
        <div className="fps-display">FPS: {fps !== null ? fps : '--'}</div>
      </div>
    </div>
  )
})

AvatarCanvas.displayName = 'AvatarCanvas'

