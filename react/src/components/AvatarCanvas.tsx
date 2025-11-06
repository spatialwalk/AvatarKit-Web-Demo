/**
 * Avatar Canvas 容器组件
 */

import { forwardRef } from 'react'

export const AvatarCanvas = forwardRef<HTMLDivElement>((props, ref) => {
  return <div ref={ref} className="canvas-container" />
})

AvatarCanvas.displayName = 'AvatarCanvas'

