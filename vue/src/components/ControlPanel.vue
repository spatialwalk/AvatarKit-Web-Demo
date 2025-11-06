<template>
  <div class="control-panel">
    <h2>🎮 控制面板</h2>
    <div class="form-group">
      <label>环境</label>
      <select :value="environment" @change="handleEnvironmentChange">
        <option :value="Environment.us">US</option>
        <option :value="Environment.cn">CN</option>
        <option :value="Environment.test">Test</option>
      </select>
    </div>

    <div class="form-group">
      <label>角色 ID</label>
      <input
        :value="characterId"
        type="text"
        placeholder="输入角色 ID"
        @input="handleCharacterIdChange"
      >
    </div>

    <div class="form-group">
      <label>Session Token</label>
      <input
        :value="sessionToken"
        type="text"
        placeholder="输入 Session Token（可选）"
        @input="handleSessionTokenChange"
      >
    </div>

    <div class="button-group">
      <button :disabled="isInitialized || isLoading" @click="onInit">
        1. 初始化 SDK
      </button>
      <button :disabled="!isInitialized || !!avatarView || isLoading || !characterId.trim()" @click="onLoadCharacter">
        2. 加载角色
      </button>
      <button :disabled="!avatarView || (avatarController?.connected) || isLoading" @click="onConnect">
        3. 连接服务
      </button>
      <button :disabled="!avatarController || !avatarController.connected || isLoading || isRecording" @click="onStartRecord">
        4. 开始录音
      </button>
      <button :disabled="!avatarController || !isRecording" @click="onStopRecord">
        停止录音
      </button>
      <button :disabled="!avatarController || !avatarController.connected" @click="onInterrupt">
        打断对话
      </button>
      <button :disabled="!avatarController || !avatarController.connected" @click="onDisconnect">
        断开连接
      </button>
      <button :disabled="!avatarView || isLoading" @click="onUnloadCharacter" style="background: #ef4444;">
        卸载角色
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Environment } from '../types'

defineProps<{
  environment: Environment
  characterId: string
  sessionToken: string
  isInitialized: boolean
  avatarView: any
  avatarController: any
  isRecording: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  environmentChange: [env: Environment]
  characterIdChange: [id: string]
  sessionTokenChange: [token: string]
  init: []
  loadCharacter: []
  connect: []
  startRecord: []
  stopRecord: []
  interrupt: []
  disconnect: []
  unloadCharacter: []
}>()

const handleEnvironmentChange = (e: Event) => {
  emit('environmentChange', (e.target as HTMLSelectElement).value as Environment)
}

const handleCharacterIdChange = (e: Event) => {
  emit('characterIdChange', (e.target as HTMLInputElement).value)
}

const handleSessionTokenChange = (e: Event) => {
  emit('sessionTokenChange', (e.target as HTMLInputElement).value)
}

const onInit = () => emit('init')
const onLoadCharacter = () => emit('loadCharacter')
const onConnect = () => emit('connect')
const onStartRecord = () => emit('startRecord')
const onStopRecord = () => emit('stopRecord')
const onInterrupt = () => emit('interrupt')
const onDisconnect = () => emit('disconnect')
const onUnloadCharacter = () => emit('unloadCharacter')
</script>

<style scoped>
.control-panel {
  background: #f9fafb;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #2563eb;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

