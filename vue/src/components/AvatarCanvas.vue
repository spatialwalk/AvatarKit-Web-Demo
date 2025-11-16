<template>
  <div ref="canvasContainerRef" class="canvas-container" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const canvasContainerRef = ref<HTMLDivElement | null>(null)

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
}
</style>

