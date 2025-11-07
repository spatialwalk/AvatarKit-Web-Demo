/**
 * Avatar Canvas container component
 */

import { forwardRef } from 'react'

export const AvatarCanvas = forwardRef<HTMLDivElement>((props, ref) => {
  return <div ref={ref} className="canvas-container" />
})

AvatarCanvas.displayName = 'AvatarCanvas'

