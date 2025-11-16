<template>
  <div class="control-panel">
    <h2>🎮 Control Panel</h2>
    <div class="form-group">
      <label>Environment</label>
      <select :value="environment" @change="handleEnvironmentChange">
        <option :value="Environment.us">US</option>
        <option :value="Environment.cn">CN</option>
        <option :value="Environment.test">Test</option>
      </select>
    </div>

    <div class="form-group">
      <label>Session Token</label>
      <input
        :value="sessionToken"
        type="text"
        placeholder="Enter Session Token (optional)"
        @input="handleSessionTokenChange"
      >
    </div>

    <div class="form-group">
      <label>Character ID</label>
      <select :value="characterId" @change="handleCharacterIdChange">
        <option value="">Select Character ID</option>
        <option value="b7ba14f6-f9aa-4f89-9934-3753d75aee39">b7ba14f6-f9aa-4f89-9934-3753d75aee39</option>
        <option value="35692117-ece1-4f77-b014-02cfa22bfb7b">35692117-ece1-4f77-b014-02cfa22bfb7b</option>
      </select>
    </div>

    <div class="form-group">
      <label>Playback Mode</label>
      <select :value="playbackMode" @change="handlePlaybackModeChange">
        <option :value="AvatarPlaybackMode.network">Network Mode</option>
        <option :value="AvatarPlaybackMode.external">External Data Mode</option>
      </select>
    </div>

    <div class="button-group">
      <button :disabled="isInitialized || isLoading" @click="onInit">
        1. Initialize SDK
      </button>
      <button :disabled="!isInitialized || !!avatarView || isLoading || !characterId.trim()" @click="() => onLoadCharacter(AvatarPlaybackMode.network)">
        2. Load Character (Network)
      </button>
      <button :disabled="!isInitialized || !!avatarView || isLoading || !characterId.trim()" @click="() => onLoadCharacter(AvatarPlaybackMode.external)">
        2. Load Character (External)
      </button>
      <button :disabled="!avatarView || currentPlaybackMode !== AvatarPlaybackMode.network || isConnected || isLoading" @click="onConnect">
        3. Connect Service
      </button>
      <button :disabled="!avatarController || currentPlaybackMode !== AvatarPlaybackMode.network || !isConnected || isLoading || isRecording" @click="onStartRecord">
        4. Start Recording
      </button>
      <button :disabled="!avatarController || (currentPlaybackMode === AvatarPlaybackMode.network && !isRecording) || (currentPlaybackMode === AvatarPlaybackMode.external && isLoading)" @click="onStopRecord">
        {{ currentPlaybackMode === AvatarPlaybackMode.network ? 'Stop Recording' : 'Play Data' }}
      </button>
      <button :disabled="!avatarController || (currentPlaybackMode === AvatarPlaybackMode.network && !isConnected)" @click="onInterrupt">
        Interrupt
      </button>
      <button :disabled="!avatarController || currentPlaybackMode !== AvatarPlaybackMode.network || !isConnected" @click="onDisconnect">
        Disconnect
      </button>
      <button :disabled="!avatarView || isLoading" @click="onUnloadCharacter" style="background: #ef4444;">
        Unload Character
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Environment } from '../types'
import { AvatarPlaybackMode } from '@spatialwalk/avatarkit'

defineProps<{
  environment: Environment
  characterId: string
  sessionToken: string
  playbackMode: AvatarPlaybackMode
  isInitialized: boolean
  avatarView: any
  avatarController: any
  isRecording: boolean
  isLoading: boolean
  isConnected: boolean
  currentPlaybackMode: AvatarPlaybackMode
}>()

const emit = defineEmits<{
  environmentChange: [env: Environment]
  characterIdChange: [id: string]
  sessionTokenChange: [token: string]
  playbackModeChange: [mode: AvatarPlaybackMode]
  init: []
  loadCharacter: [mode: AvatarPlaybackMode]
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
  emit('characterIdChange', (e.target as HTMLSelectElement).value)
}

const handleSessionTokenChange = (e: Event) => {
  emit('sessionTokenChange', (e.target as HTMLInputElement).value)
}

const handlePlaybackModeChange = (e: Event) => {
  emit('playbackModeChange', (e.target as HTMLSelectElement).value as AvatarPlaybackMode)
}

const onInit = () => emit('init')
const onLoadCharacter = (mode: AvatarPlaybackMode) => emit('loadCharacter', mode)
const onConnect = () => emit('connect')
const onStartRecord = () => emit('startRecord')
const onStopRecord = () => emit('stopRecord')
const onInterrupt = () => emit('interrupt')
const onDisconnect = () => emit('disconnect')
const onUnloadCharacter = () => emit('unloadCharacter')
</script>

<style scoped>
.control-panel {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.control-panel h2 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

button {
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:disabled {
  background: #9ca3af !important;
  background-image: none !important;
  background-color: #9ca3af !important;
  color: #6b7280 !important;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:disabled {
  background: #9ca3af !important;
  background-color: #9ca3af !important;
  color: #6b7280 !important;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:disabled {
  background: #9ca3af !important;
  background-color: #9ca3af !important;
  color: #6b7280 !important;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

button:disabled {
  opacity: 1;
  cursor: not-allowed;
  background: #9ca3af !important;
  background-image: none !important;
  background-color: #9ca3af !important;
  color: #6b7280 !important;
  transform: none !important;
  box-shadow: none !important;
}
</style>

