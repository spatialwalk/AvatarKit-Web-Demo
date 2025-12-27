<template>
  <div class="control-panel">
    <h2>🎮 Control Panel</h2>
    <div class="form-group">
      <label>Environment</label>
      <div style="padding: 8px 12px; background: #f0f0f0; border-radius: 6px; color: #666; font-size: 14px">
        {{ environment === SDKEnvironment.cn ? 'CN' : environment === SDKEnvironment.intl ? 'International' : 'Test' }}
      </div>
    </div>

    <div class="form-group">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
        <label style="margin-bottom: 0; display: inline-block; line-height: 22px">Character ID</label>
        <button
          @click="showAddIdModal = true"
          style="padding: 0; margin: 0; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; line-height: 22px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0"
          title="Add new Character ID"
        >
          ➕
        </button>
        <a
          href="https://docs.spatialreal.ai/overview/test-avatars"
          target="_blank"
          rel="noopener noreferrer"
          style="padding: 0; margin: 0; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; line-height: 22px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; text-decoration: none;"
          title="Get test character IDs"
        >
          🔗
        </a>
      </div>
      <select :value="characterId" @change="handleCharacterIdChange">
        <option value="">Select Character ID</option>
        <option v-for="id in characterIdList" :key="id" :value="id">{{ id }}</option>
      </select>
    </div>

    <div class="button-group">
      <button v-if="onInit" :disabled="isInitialized || isLoading" @click="onInit">
        1. Initialize SDK
      </button>
      <button :disabled="!isInitialized || !!avatarView || isLoading || !characterId.trim()" @click="onLoadCharacter">
        {{ onInit ? '2. Load Character' : '1. Load Character' }}
      </button>
      <button :disabled="!avatarView || currentPlaybackMode !== 'network' || isConnected || isLoading" @click="onConnect">
        {{ onInit ? '3. Connect Service' : '2. Connect Service' }}
      </button>
      <button v-if="currentPlaybackMode === 'network'" :disabled="!avatarController || !isConnected || isLoading || conversationState === 'playing' || conversationState === 'pausing' || isSendingAudio" @click="onLoadAudio">
        Load Audio
      </button>
      <button :disabled="!avatarController || currentPlaybackMode !== 'network' || !isConnected || isLoading || isRecording || conversationState === 'playing' || conversationState === 'pausing' || isSendingAudio" @click="onStartRecord">
        {{ onInit ? '4. Start Recording' : '3. Start Recording' }}
      </button>
      <button :disabled="!avatarController || (currentPlaybackMode === 'network' && !isRecording) || (currentPlaybackMode === 'external' && isLoading)" @click="onStopRecord">
        {{ currentPlaybackMode === 'network' ? 'Stop Recording' : 'Play Data' }}
      </button>
      <button :disabled="!avatarController || (currentPlaybackMode === 'network' && !isConnected)" @click="onInterrupt">
        Interrupt
      </button>
      <button :disabled="!avatarController || currentPlaybackMode !== 'network' || !isConnected" @click="onDisconnect">
        Disconnect
      </button>
      <button :disabled="!avatarView || isLoading" @click="onUnloadCharacter" style="background: #ef4444;">
        Unload Character
      </button>
    </div>


    
    <!-- Add Character ID Modal -->
    <div
      v-if="showAddIdModal"
      class="modal-overlay"
      @click="showAddIdModal = false"
    >
      <div class="modal-content" @click.stop>
        <h3>Add New Character ID</h3>
        <input
          v-model="newCharacterId"
          type="text"
          placeholder="Enter Character ID"
          @keydown.enter="handleAddCharacterId"
          @keydown.esc="showAddIdModal = false"
          autofocus
        />
        <div class="modal-actions">
          <button @click="showAddIdModal = false">Cancel</button>
          <button @click="handleAddCharacterId" :disabled="!newCharacterId.trim()">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Environment } from '../types'
import { Environment as SDKEnvironment } from '@spatialwalk/avatarkit'

const showAddIdModal = ref(false)
const newCharacterId = ref('')

const props = defineProps<{
  environment: Environment
  characterId: string
  characterIdList: string[]
  isInitialized: boolean
  avatarView: any
  avatarController: any
  isRecording: boolean
  isLoading: boolean
  isConnected: boolean
  currentPlaybackMode: 'network' | 'external'
  conversationState: 'idle' | 'playing' | 'pausing' | null
  isSendingAudio?: boolean
  init?: () => void
}>()

const emit = defineEmits<{
  characterIdChange: [id: string]
  init: []
  loadCharacter: []
  connect: []
  loadAudio: []
  startRecord: []
  stopRecord: []
  interrupt: []
  disconnect: []
  unloadCharacter: []
}>()

const handleCharacterIdChange = (e: Event) => {
  emit('characterIdChange', (e.target as HTMLSelectElement).value)
}

const handleAddCharacterId = () => {
  const trimmedId = newCharacterId.value.trim()
  if (trimmedId) {
    emit('characterIdChange', trimmedId)
    newCharacterId.value = ''
    showAddIdModal.value = false
  }
}

const onInit = props.init ? () => emit('init') : undefined
const onLoadCharacter = () => emit('loadCharacter')
const onConnect = () => emit('connect')
const onLoadAudio = () => emit('loadAudio')
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  min-width: 400px;
  max-width: 90%;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 16px;
}

.modal-content input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.modal-actions button {
  width: auto;
  margin-bottom: 0;
  padding: 8px 16px;
}

.modal-actions button:first-child {
  background: #f0f0f0;
  color: #333;
}

.modal-actions button:last-child {
  background: #667eea;
  color: white;
}

.modal-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

