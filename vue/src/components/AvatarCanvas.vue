<template>
  <div ref="canvasContainerRef" class="canvas-container">
    <div class="performance-display">
      <div class="fps-display">FPS: {{ fps !== null ? fps : '--' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { AvatarView } from '@spatialwalk/avatarkit'

interface Props {
  avatarView?: AvatarView | null
}

const props = defineProps<Props>()

const canvasContainerRef = ref<HTMLDivElement | null>(null)
const fps = ref<number | null>(null)

const frameCount = ref(0)
const lastTime = ref(performance.now())
let animationFrameId: number | null = null

// FPS monitoring
const updateFPS = () => {
  frameCount.value++
  const currentTime = performance.now()
  const elapsed = currentTime - lastTime.value

  if (elapsed >= 1000) {
    // 每秒更新一次FPS
    fps.value = Math.round((frameCount.value * 1000) / elapsed)
    frameCount.value = 0
    lastTime.value = currentTime
  }

  animationFrameId = requestAnimationFrame(updateFPS)
}

onMounted(() => {
  animationFrameId = requestAnimationFrame(updateFPS)
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})

defineExpose({
  canvasContainerRef: canvasContainerRef,
})
</script>

<style scoped>
.canvas-container {
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.performance-display {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1000;
  pointer-events: none;
  user-select: none;
}

.fps-display {
  background: rgba(0, 0, 0, 0.7);
  color: #00ff00;
  padding: 4px 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  text-align: right;
  min-width: 80px;
}
</style>

