/**
 * Avatar Canvas container component
 */

import { forwardRef, useEffect, useRef, useState } from 'react'
import type { AvatarView } from '@spatialwalk/avatarkit'

interface AvatarCanvasProps {
  avatarView?: AvatarView | null
  onTransformClick?: () => void
  showTransformButton?: boolean
  volume?: number
  onVolumeChange?: (volume: number) => void
  showVolumeSlider?: boolean
  showPlayPauseButton?: boolean
  onPlayPauseClick?: () => void
  playPauseIcon?: string
  playPauseTitle?: string
  playPauseDisabled?: boolean
}

export const AvatarCanvas = forwardRef<HTMLDivElement, AvatarCanvasProps>((props, ref) => {
  const { avatarView, onTransformClick, showTransformButton = false, volume = 100, onVolumeChange, showVolumeSlider = false, showPlayPauseButton = false, onPlayPauseClick, playPauseIcon = '▶️', playPauseTitle = 'Play', playPauseDisabled = false } = props
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
      {/* Play/Pause button (bottom left) */}
      {showPlayPauseButton && !playPauseDisabled && (
        <button
          onClick={onPlayPauseClick}
          title={playPauseTitle}
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            width: '72px',
            height: '72px',
            background: 'transparent',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            zIndex: 1000,
            transition: 'all 0.2s',
            lineHeight: '1',
          }}
        >
          {playPauseIcon}
        </button>
      )}
      
      {/* Volume control (above transform button, right side) */}
      {showVolumeSlider && (
        <div style={{ position: 'absolute', right: '12px', bottom: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1000 }}>
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
              width: '36px',
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
      
      {/* Transform button (bottom right) */}
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
            lineHeight: '1',
          }}
        >
          ⚙️
        </button>
      )}
    </div>
  )
})

AvatarCanvas.displayName = 'AvatarCanvas'

