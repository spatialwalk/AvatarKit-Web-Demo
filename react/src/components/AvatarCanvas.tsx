/**
 * Avatar Canvas container component
 */

import { forwardRef, useEffect, useRef, useState } from 'react'
import type { AvatarView } from '@spatialwalk/avatarkit'

interface AvatarCanvasProps {
  avatarView?: AvatarView | null
  onTransformClick?: () => void
  showTransformButton?: boolean
  onSetBackground?: () => void
  onRemoveBackground?: () => void
  showBackgroundButtons?: boolean
  volume?: number
  onVolumeChange?: (volume: number) => void
  showVolumeSlider?: boolean
}

export const AvatarCanvas = forwardRef<HTMLDivElement, AvatarCanvasProps>((props, ref) => {
  const { avatarView, onTransformClick, showTransformButton = false, onSetBackground, onRemoveBackground, showBackgroundButtons = false, volume = 100, onVolumeChange, showVolumeSlider = false } = props
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
      {showBackgroundButtons && (
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px', zIndex: 1000 }}>
          <button
            onClick={onSetBackground}
            title="Set Background"
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'all 0.2s',
            }}
          >
            🖼️
          </button>
          <button
            onClick={onRemoveBackground}
            title="Remove Background"
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'all 0.2s',
            }}
          >
            🗑️
          </button>
        </div>
      )}
      {showVolumeSlider && (
        <div style={{ position: 'absolute', left: '12px', bottom: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1000 }}>
          <span style={{ fontSize: '18px', color: 'white', background: 'rgba(0, 0, 0, 0.7)', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px' }}>
            🔊
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange?.(parseInt(e.target.value))}
            orient="vertical"
            style={{
              width: '80px',
              height: '120px',
              cursor: 'pointer',
              writingMode: 'bt-lr',
              WebkitAppearance: 'slider-vertical',
            }}
          />
          <span style={{ fontSize: '12px', color: 'white', background: 'rgba(0, 0, 0, 0.7)', padding: '2px 6px', borderRadius: '4px', minWidth: '36px', textAlign: 'center' }}>
            {volume}%
          </span>
        </div>
      )}
      {showTransformButton && (
        <button
          className="transform-button"
          onClick={onTransformClick}
          title="Transform Settings"
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            zIndex: 1000,
            transition: 'all 0.2s',
          }}
        >
          ⚙️
        </button>
      )}
    </div>
  )
})

AvatarCanvas.displayName = 'AvatarCanvas'

