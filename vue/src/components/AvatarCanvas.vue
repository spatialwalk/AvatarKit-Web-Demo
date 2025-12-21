<template>
  <div ref="canvasContainerRef" class="canvas-container">
    <div class="performance-display">
      <div class="fps-display">FPS: {{ fps !== null ? fps : '--' }}</div>
    </div>
    <div v-if="showBackgroundButtons" style="position: absolute; top: 12px; left: 12px; display: flex; gap: 8px; z-index: 1000;">
      <button
        @click="onSetBackground"
        title="Set Background"
        style="width: 32px; height: 32px; background: rgba(0, 0, 0, 0.7); color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.2s;"
      >
        🖼️
      </button>
      <button
        @click="onRemoveBackground"
        title="Remove Background"
        style="width: 32px; height: 32px; background: rgba(0, 0, 0, 0.7); color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.2s;"
      >
        🗑️
      </button>
    </div>
    <!-- Play/Pause button (bottom left) -->
    <button
      v-if="showPlayPauseButton && !playPauseDisabled"
      @click="onPlayPauseClick"
      :title="playPauseTitle"
      style="position: absolute; bottom: 12px; left: 12px; width: 72px; height: 72px; background: transparent; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 36px; z-index: 1000; transition: all 0.2s; line-height: 1;"
    >
      {{ playPauseIcon }}
    </button>
    
    <!-- Volume control (above transform button, right side) -->
    <div v-if="showVolumeSlider" style="position: absolute; right: 12px; bottom: 60px; display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 1000;">
      <span style="font-size: 18px; color: white; background: rgba(0, 0, 0, 0.7); padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
        🔊
      </span>
      <input
        type="range"
        min="0"
        max="100"
        :value="volume"
        @input="(e) => onVolumeChange?.(parseInt((e.target as HTMLInputElement).value))"
        orient="vertical"
        style="width: 36px; height: 120px; cursor: pointer; writing-mode: bt-lr; -webkit-appearance: slider-vertical;"
      />
      <span style="font-size: 12px; color: white; background: rgba(0, 0, 0, 0.7); padding: 2px 6px; border-radius: 4px; min-width: 36px; text-align: center;">
        {{ volume }}%
      </span>
    </div>
    
    <!-- Transform button (bottom right) -->
    <button
      v-if="showTransformButton"
      class="transform-button"
      @click="onTransformClick"
      title="Transform Settings"
      style="position: absolute; bottom: 12px; right: 12px; width: 36px; height: 36px; background: rgba(0, 0, 0, 0.7); color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; z-index: 1000; transition: all 0.2s; line-height: 1;"
    >
      ⚙️
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { AvatarView } from '@spatialwalk/avatarkit'

interface Props {
  avatarView?: AvatarView | null
  showTransformButton?: boolean
  onTransformClick?: () => void
  showBackgroundButtons?: boolean
  onSetBackground?: () => void
  onRemoveBackground?: () => void
  volume?: number
  onVolumeChange?: (volume: number) => void
  showVolumeSlider?: boolean
  showPlayPauseButton?: boolean
  onPlayPauseClick?: () => void
  playPauseIcon?: string
  playPauseTitle?: string
  playPauseDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTransformButton: false,
  showBackgroundButtons: false,
  showVolumeSlider: false,
  volume: 100,
  showPlayPauseButton: false,
  playPauseIcon: '▶️',
  playPauseTitle: 'Play',
  playPauseDisabled: false,
})

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
  // Expose the DOM element directly for easier access
  get canvasContainer() {
    return canvasContainerRef.value
  }
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

