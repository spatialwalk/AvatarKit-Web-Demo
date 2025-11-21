<template>
  <div class="container">
    <div class="header">
      <h1>🚀 SPAvatar SDK - Vue Example (Multi-Character)</h1>
      <p>支持同时显示多个角色视图</p>
      <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px; justify-content: center; flex-wrap: wrap; position: relative">
        <template v-if="!globalSDKInitialized && !sdkInitializing">
          <span class="arrow-pointing-right" style="color: #ff0000; font-size: 48px; font-weight: bold; line-height: 1">→</span>
          <button 
            @click="handleInitSDK"
            class="btn-init-sdk"
          >
            🔧 初始化 SDK
          </button>
        </template>
        <p v-if="sdkInitializing" style="color: #ffeb3b; margin: 0">⏳ 正在初始化 SDK...</p>
        <p v-if="globalSDKInitialized" style="color: #10b981; margin: 0">✅ SDK 已初始化</p>
        <button 
          v-if="panels.length < 4"
          class="btn-add-panel-header" 
          @click="handleAddPanel"
        >
          + 添加角色面板
        </button>
      </div>
    </div>

    <div class="content">
      <div class="panels-container">
        <AvatarPanel
          v-for="panel in panels"
          :key="panel.id"
          :panel-id="panel.id"
          :globalSDKInitialized="globalSDKInitialized"
          :on-remove="panels.length > 1 ? () => handleRemovePanel(panel.id) : undefined"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AvatarPanel from './components/AvatarPanel.vue'
import { AvatarKit, Environment } from '@spatialwalk/avatarkit'

interface Panel {
  id: string
}

const panels = ref<Panel[]>([{ id: '1' }])
const globalSDKInitialized = ref(false)
const sdkInitializing = ref(false)

// 检查是否已经初始化
onMounted(() => {
  if (AvatarKit.isInitialized) {
    globalSDKInitialized.value = true
  }
})

// 手动初始化 SDK
const handleInitSDK = async () => {
  if (AvatarKit.isInitialized || sdkInitializing.value) {
    return
  }

  try {
    sdkInitializing.value = true
    await AvatarKit.initialize('demo', { environment: Environment.test })
    globalSDKInitialized.value = true
  } catch (error) {
    console.error('Failed to initialize global SDK:', error)
  } finally {
    sdkInitializing.value = false
  }
}

const handleAddPanel = () => {
  const newId = String(panels.value.length + 1)
  panels.value = [...panels.value, { id: newId }]
}

const handleRemovePanel = (panelId: string) => {
  if (panels.value.length <= 1) {
    return // 至少保留一个面板
  }
  panels.value = panels.value.filter(p => p.id !== panelId)
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>

.container {
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  background: white;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 24px;
  text-align: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.header p {
  opacity: 0.9;
  font-size: 14px;
}

.arrow-pointing-right {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: translateX(0);
  }
  50% {
    opacity: 0.6;
    transform: translateX(4px);
  }
}

.btn-init-sdk {
  padding: 12px 24px;
  background: #ffffff;
  color: #667eea;
  border: 2px solid #ffffff;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-init-sdk:hover {
  background: #f8f9fa;
  border-color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.btn-init-sdk:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-add-panel-header {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.btn-add-panel-header:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  background: #f5f5f5;
}

.panels-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 100%;
}

@media (max-width: 1024px) {
  .panels-container {
    grid-template-columns: 1fr;
  }
}

.btn-add-panel {
    width: 100%;
  padding: 40px;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.btn-add-panel:hover {
  background: #f3f4f6;
  border-color: #667eea;
  color: #667eea;
}

.control-panel {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.control-panel.log-panel-container {
  flex: 1;
  min-height: 0;
}

.control-panel h2 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
}

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
