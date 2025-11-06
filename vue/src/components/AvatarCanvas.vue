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
  background: #000;
  border-radius: 12px;
  margin-bottom: 20px;
  position: relative;
  width: 100%;
  height: 600px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

#avatarCanvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
}
</style>

