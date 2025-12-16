<template>
  <div class="avatar-panel">
    <div class="avatar-panel-header">
      <h3>角色面板 {{ panelId }}</h3>
      <button v-if="onRemove" class="btn-remove" @click="onRemove" title="移除面板">
        ×
      </button>
    </div>
    
    <div class="avatar-panel-content">
      <div class="avatar-panel-controls">
        <StatusBar :message="logger.statusMessage.value" :type="logger.statusClass.value" />
        <ControlPanel
          :environment="AvatarSDK.configuration?.environment || Environment.intl"
          :character-id="characterId"
          :character-id-list="characterIdList"
          :is-initialized="globalSDKInitialized"
          :avatar-view="sdk.avatarView.value"
          :avatar-controller="sdk.avatarController.value"
          :is-recording="audioRecorder.isRecording.value"
          :is-loading="isLoading"
          :is-connected="sdk.isConnected.value"
          :current-playback-mode="(AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk) === DrivingServiceMode.sdk ? 'network' : 'external'"
          @character-id-change="handleCharacterIdChange"
          @load-character="handleLoadCharacter"
          @connect="handleConnect"
          @start-record="handleStartRecord"
          @stop-record="handleStopRecord"
          @interrupt="handleInterrupt"
          @disconnect="handleDisconnect"
          @unload-character="handleUnloadCharacter"
          :conversation-state="conversationState"
        />
        <button 
          class="btn btn-primary" 
          @click="toggleLogDrawer"
          style="margin-top: 12px"
        >
          {{ isLogDrawerOpen ? '📋 隐藏日志' : '📋 显示日志' }}
        </button>
      </div>
      <div class="avatar-panel-canvas">
        <AvatarCanvas 
          ref="avatarCanvasRef" 
          :avatarView="(sdk.avatarView.value as any) ?? null"
          :showTransformButton="!!sdk.avatarView.value"
          :showBackgroundButtons="!!sdk.avatarView.value"
          :volume="volume"
          :onVolumeChange="(v) => {
            volume = v
            try {
              sdk.setVolume(v / 100)
            } catch (error) {
              logger.updateStatus(`Volume change failed: ${error instanceof Error ? error.message : String(error)}`, 'error')
            }
          }"
          :showVolumeSlider="!!sdk.avatarView.value"
          @transform-click="handleOpenTransformModal"
          @set-background="() => {
            if (sdk.avatarView.value) {
              try {
                sdk.avatarView.value.setBackgroundImage('/src/demo-background.png')
                sdk.avatarView.value.isOpaque = true
                logger.log('success', 'Background image set')
                logger.updateStatus('Background image set', 'success')
              } catch (error) {
                logger.log('error', `Failed to set background: ${error instanceof Error ? error.message : String(error)}`)
                logger.updateStatus(`Failed to set background: ${error instanceof Error ? error.message : String(error)}`, 'error')
              }
            }
          }"
          @remove-background="() => {
            if (sdk.avatarView.value) {
              try {
                sdk.avatarView.value.setBackgroundImage(null)
                sdk.avatarView.value.isOpaque = false
                logger.log('success', 'Background image removed')
                logger.updateStatus('Background image removed', 'success')
              } catch (error) {
                logger.log('error', `Failed to remove background: ${error instanceof Error ? error.message : String(error)}`)
                logger.updateStatus(`Failed to remove background: ${error instanceof Error ? error.message : String(error)}`, 'error')
              }
            }
          }"
        />
      </div>
    </div>
    
    <!-- Log Drawer -->
    <div class="log-drawer" :class="{ open: isLogDrawerOpen }">
      <div class="log-drawer-header">
        <h2>📋 Logs</h2>
        <button class="btn-close-drawer" @click="closeLogDrawer" title="关闭日志面板">
          ×
        </button>
      </div>
      <LogPanel :logs="logger.logs.value" @clear="logger.clear" />
    </div>
    
    <!-- Transform Settings Modal -->
    <div
      v-if="isTransformModalOpen"
      class="modal-overlay"
      style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;"
      @click.self="isTransformModalOpen = false"
    >
      <div
        class="modal-content"
        style="background: white; padding: 24px; border-radius: 12px; min-width: 400px; max-width: 90%; max-height: 90vh; overflow-y: auto;"
      >
        <h3 style="margin-top: 0; margin-bottom: 16px;">Transform Settings</h3>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">
            X Position (-1 to 1)
          </label>
          <input
            type="number"
            step="0.1"
            min="-1"
            max="1"
            v-model="transformX"
            style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
            @keydown.enter="handleApplyTransform"
            @keydown.esc="isTransformModalOpen = false"
          />
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
            -1 = left edge, 0 = center, 1 = right edge
          </p>
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">
            Y Position (-1 to 1)
          </label>
          <input
            type="number"
            step="0.1"
            min="-1"
            max="1"
            v-model="transformY"
            style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
            @keydown.enter="handleApplyTransform"
            @keydown.esc="isTransformModalOpen = false"
          />
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
            -1 = bottom edge, 0 = center, 1 = top edge
          </p>
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">
            Scale Factor
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="5"
            v-model="transformScale"
            style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
            @keydown.enter="handleApplyTransform"
            @keydown.esc="isTransformModalOpen = false"
          />
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
            1.0 = original size, 2.0 = double size, 0.5 = half size
          </p>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button
            @click="isTransformModalOpen = false"
            style="padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 6px; cursor: pointer;"
          >
            Cancel
          </button>
          <button
            @click="handleApplyTransform"
            style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, nextTick, watch } from 'vue'
import { useAvatarSDK } from '../composables/useAvatarSDK'
import { Environment } from '../types'
import { AvatarSDK, DrivingServiceMode, ConversationState } from '@spatialwalk/avatarkit'
import { useLogger } from '../composables/useLogger'
import { useAudioRecorder } from '../composables/useAudioRecorder'
import StatusBar from './StatusBar.vue'
import ControlPanel from './ControlPanel.vue'
import AvatarCanvas from './AvatarCanvas.vue'
import LogPanel from './LogPanel.vue'

const AUDIO_SAMPLE_RATE = 16000

interface Props {
  panelId: string
  globalSDKInitialized: boolean
  onRemove?: () => void
}

const props = defineProps<Props>()

// Configuration state
const characterIdList = ref<string[]>([])
const characterId = ref('')
const isLoading = ref(false)
const conversationState = ref<ConversationState | null>(null)
const volume = ref(100)

// Operation state flags
const isProcessing = ref({
  loadCharacter: false,
  connect: false,
  startRecord: false,
  stopRecord: false,
  interrupt: false,
  disconnect: false,
  unload: false,
})

// Composables
const logger = useLogger()
const audioRecorder = useAudioRecorder()
const sdk = useAvatarSDK()

// Refs
const avatarCanvasRef = ref<InstanceType<typeof AvatarCanvas> | null>(null)
const shouldContinueSendingData = ref(false)

// Log drawer state
const isLogDrawerOpen = ref(false)

const toggleLogDrawer = () => {
  isLogDrawerOpen.value = !isLogDrawerOpen.value
}

const closeLogDrawer = () => {
  isLogDrawerOpen.value = false
}

// Transform modal state
const isTransformModalOpen = ref(false)
const transformX = ref('0')
const transformY = ref('0')
const transformScale = ref('1')

const handleOpenTransformModal = () => {
  // Try to get current transform values, fallback to defaults
  const avatarView = sdk.avatarView.value as any
  if (avatarView?.transform) {
    try {
      const currentTransform = avatarView.transform
      transformX.value = String(currentTransform.x || 0)
      transformY.value = String(currentTransform.y || 0)
      transformScale.value = String(currentTransform.scale || 1)
    } catch (error) {
      // Fallback to defaults if transform is not available
      transformX.value = '0'
      transformY.value = '0'
      transformScale.value = '1'
    }
  } else {
    transformX.value = '0'
    transformY.value = '0'
    transformScale.value = '1'
  }
  isTransformModalOpen.value = true
}

const handleApplyTransform = () => {
  if (!sdk.avatarView.value) {
    logger.updateStatus('Please load character first', 'warning')
    return
  }
  
  try {
    const x = parseFloat(transformX.value)
    const y = parseFloat(transformY.value)
    const scale = parseFloat(transformScale.value)
    
    // Validate values
    if (isNaN(x) || x < -1 || x > 1) {
      throw new Error('X position must be between -1 and 1')
    }
    if (isNaN(y) || y < -1 || y > 1) {
      throw new Error('Y position must be between -1 and 1')
    }
    if (isNaN(scale) || scale < 0.1 || scale > 5) {
      throw new Error('Scale must be between 0.1 and 5')
    }
    
    // Use transform property (getter/setter) instead of setTransform method
    const avatarView = sdk.avatarView.value as any
    if (!avatarView?.transform) {
      throw new Error('transform property is not available in this SDK version')
    }
    avatarView.transform = { x, y, scale }
    logger.log('success', `Transform applied: x=${x}, y=${y}, scale=${scale}`)
    logger.updateStatus(`Transform applied: x=${x}, y=${y}, scale=${scale}`, 'success')
    isTransformModalOpen.value = false
    transformX.value = '0'
    transformY.value = '0'
    transformScale.value = '1'
  } catch (error) {
    logger.log('error', `Transform failed: ${error instanceof Error ? error.message : String(error)}`)
    logger.updateStatus(`Transform failed: ${error instanceof Error ? error.message : String(error)}`, 'error')
  }
}

// Load character (mode is determined by SDK initialization)
const handleLoadCharacter = async () => {
  if (isProcessing.value.loadCharacter || sdk.avatarView.value) {
    return
  }

  if (!props.globalSDKInitialized || !characterId.value.trim()) {
    logger.updateStatus('Please wait for SDK initialization and enter character ID', 'warning')
    return
  }

  // Wait for next tick to ensure component is mounted
  await nextTick()
  
  // Get canvas container
  // avatarCanvasRef.value.canvasContainerRef is a ref, so we need to access .value to get the DOM element
  const canvasContainer = 
    (avatarCanvasRef.value?.canvasContainer as HTMLElement | undefined) ||
    ((avatarCanvasRef.value?.canvasContainerRef as any)?.value as HTMLElement | undefined)
  
  if (!canvasContainer || !(canvasContainer instanceof HTMLElement)) {
    logger.updateStatus('Canvas container not found', 'error')
    logger.log('error', `Canvas container is not available. avatarCanvasRef exists: ${!!avatarCanvasRef.value}`)
    return
  }

  try {
    isProcessing.value.loadCharacter = true
    isLoading.value = true
    
    // Get current driving service mode from SDK configuration
    const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
    const modeName = currentMode === DrivingServiceMode.sdk ? 'SDK mode (network)' : 'Host mode (external data)'
    logger.updateStatus(`Loading character (${modeName})...`, 'info')
    logger.log('info', `Starting to load character: ${characterId.value} (mode: ${modeName})`)

    await sdk.loadCharacter(
      characterId.value,
      canvasContainer,
      {
        onConnectionState: (state) => {
          logger.log('info', `Connection state: ${state}`)
          if (state === 'connected') {
            logger.updateStatus('Connected', 'success')
          } else if (state === 'disconnected') {
            logger.updateStatus('Disconnected', 'info')
          }
        },
        onConversationState: (state: ConversationState) => {
          conversationState.value = state
          logger.log('info', `Conversation state: ${state}`)
        },
        onError: (error: Error) => {
          logger.log('error', `Error: ${error.message}`)
          logger.updateStatus(`Error: ${error.message}`, 'error')
        },
      },
    )

    // Set initial volume
    try {
      const currentVolume = sdk.getVolume()
      volume.value = Math.round(currentVolume * 100)
    } catch (error) {
      // Ignore if volume not available
    }

    logger.updateStatus('Character loaded successfully', 'success')
    logger.log('success', 'Character loaded successfully')
    
    await nextTick()
    isLoading.value = false
  } catch (error) {
    logger.updateStatus(
      `Load failed: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    )
    logger.log('error', `Load failed: ${error instanceof Error ? error.message : String(error)}`)
    isLoading.value = false
  } finally {
    isProcessing.value.loadCharacter = false
  }
}

// Connect service (network mode only)
const handleConnect = async () => {
  if (isProcessing.value.connect) {
    return
  }

  const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
  if (currentMode !== DrivingServiceMode.sdk) {
    logger.updateStatus('Connect is only available in SDK mode (network mode)', 'warning')
    return
  }

  if (!sdk.avatarView.value) {
    logger.updateStatus('Please load character first', 'warning')
    return
  }

  if (sdk.isConnected.value) {
    logger.updateStatus('Already connected', 'warning')
    return
  }
  
  try {
    isProcessing.value.connect = true
    isLoading.value = true
    logger.updateStatus('Connecting to service...', 'info')
    logger.log('info', 'Connecting to service...')

    await sdk.connect()

    logger.updateStatus('Connected successfully', 'success')
    logger.log('success', 'Connected successfully')
  } catch (error) {
    logger.updateStatus(
      `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    )
    logger.log('error', `Connection failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isLoading.value = false
    isProcessing.value.connect = false
  }
}

// Start recording (network mode only)
const handleStartRecord = async () => {
  if (isProcessing.value.startRecord || audioRecorder.isRecording.value) {
    return
  }

  const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
  if (currentMode === DrivingServiceMode.sdk && !sdk.isConnected.value) {
    logger.updateStatus('Please connect to service first', 'warning')
    return
  }

  if (!sdk.avatarView.value) {
    logger.updateStatus('Please load character first', 'warning')
    return
  }

  try {
    isProcessing.value.startRecord = true
    logger.log('info', 'Starting recording...')

    await audioRecorder.start()

    logger.updateStatus('Recording...', 'success')
    logger.log('success', 'Recording started')
  } catch (error) {
    logger.updateStatus(
      `Recording failed: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    )
    logger.log('error', `Recording failed: ${error instanceof Error ? error.message : String(error)}`)
    isProcessing.value.startRecord = false
  } finally {
    isProcessing.value.startRecord = false
  }
}

// Stop recording / Play external data
const handleStopRecord = async () => {
  if (isProcessing.value.stopRecord) {
    return
  }

      const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
      if (currentMode === DrivingServiceMode.sdk) {
    if (!audioRecorder.isRecording.value) {
      logger.updateStatus('Not recording', 'warning')
      return
    }
  } else {
    if (!sdk.avatarView.value) {
      logger.updateStatus('Please load character first', 'warning')
      return
    }
  }

  try {
    isProcessing.value.stopRecord = true
    
      const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
      if (currentMode === DrivingServiceMode.sdk) {
      const audioBuffer = await audioRecorder.stop()

      if (audioBuffer && sdk.avatarController.value) {
        const duration = (audioBuffer.byteLength / 2 / AUDIO_SAMPLE_RATE).toFixed(2)
        logger.log('info', `Recording completed, total length: ${audioBuffer.byteLength} bytes (${duration}s, ${AUDIO_SAMPLE_RATE / 1000}kHz PCM16)`)
        sdk.sendAudio(audioBuffer, true)
        logger.log('success', 'Complete audio data sent')
      } else if (!audioBuffer) {
        logger.log('warning', 'No audio data collected')
      }

      logger.updateStatus('Recording stopped', 'info')
      logger.log('success', 'Recording stopped')
    } else {
      await handleExternalDataMode()
    }
  } catch (error) {
    logger.log('error', `Operation failed: ${error instanceof Error ? error.message : String(error)}`)
    logger.updateStatus(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error')
  } finally {
    isProcessing.value.stopRecord = false
  }
}

// Handle external data mode
const handleExternalDataMode = async () => {
  // Host mode: fetch audio and animation data from API
  try {
    logger.log('info', 'Fetching data from API...')
    logger.updateStatus('Fetching data from API...', 'info')
    
    const response = await fetch('https://server-sdk-mock-demo.spatialwalk.cn/media')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // API 返回的数据结构: { audio: string, animations: string[] }
    // audio 和 animations 都是 base64 编码的字符串
    if (!data.audio || !data.animations) {
      throw new Error('Invalid data format: missing audio or animations')
    }
    
    // 将 base64 字符串解码为 Uint8Array
    const audioData = base64ToUint8Array(data.audio)
    const animationsData = data.animations.map((anim: string) => base64ToUint8Array(anim))
    
    logger.log('success', 'Data fetched and decoded successfully')
    logger.updateStatus('Playing data...', 'info')
    
    // 使用 SDK 播放数据
    // 1. 发送音频数据（最后一个 chunk 标记为结束）
    const conversationId = sdk.yieldAudioData(audioData, true)
    
      if (!conversationId) {
      throw new Error('Failed to get conversation ID from audio data')
    }
    
    // 2. 发送动画数据
    sdk.yieldFramesData(animationsData, conversationId)
    
    logger.log('success', 'Data playback started')
    logger.updateStatus('Data playback started', 'success')
    
  } catch (error) {
    logger.log('error', `Failed to fetch or play data from API: ${error instanceof Error ? error.message : String(error)}`)
    logger.updateStatus(`Failed: ${error instanceof Error ? error.message : String(error)}`, 'error')
    throw error
  }
}

/**
 * 将 base64 字符串转换为 Uint8Array
 */
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}



// Interrupt conversation
const handleInterrupt = () => {
  if (isProcessing.value.interrupt) {
    return
  }

  if (!sdk.avatarView.value) {
    logger.updateStatus('No character loaded', 'warning')
    return
  }

  try {
    isProcessing.value.interrupt = true
    
      const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
      if (currentMode === DrivingServiceMode.host) {
      shouldContinueSendingData.value = false
    }
    
    sdk.interrupt()
    logger.updateStatus('Current conversation interrupted', 'info')
    logger.log('info', 'Current conversation interrupted')
  } catch (error) {
    logger.updateStatus(
      `Interrupt failed: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    )
    logger.log('error', `Interrupt failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isProcessing.value.interrupt = false
  }
}

// Disconnect
const handleDisconnect = async () => {
  if (isProcessing.value.disconnect) {
    return
  }

    const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
    if (currentMode !== DrivingServiceMode.sdk) {
      logger.updateStatus('Disconnect is only available in SDK mode (network mode)', 'warning')
    return
  }

  if (!sdk.isConnected.value) {
    logger.updateStatus('Not connected', 'warning')
    return
  }

  try {
    isProcessing.value.disconnect = true
    isLoading.value = true

    if (audioRecorder.isRecording.value) {
      await handleStopRecord()
    }
  
    await sdk.disconnect()
    logger.updateStatus('Disconnected', 'info')
    logger.log('info', 'Disconnected')
  } catch (error) {
    logger.log('error', `Disconnect failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isLoading.value = false
    isProcessing.value.disconnect = false
  }
}

// Unload character
const handleUnloadCharacter = () => {
  if (isProcessing.value.unload) {
    return
  }

  if (!sdk.avatarView.value) {
    logger.updateStatus('No character loaded', 'warning')
    return
  }

  try {
    isProcessing.value.unload = true

    // Stop external data playback if active
      const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
      if (currentMode === DrivingServiceMode.host) {
      shouldContinueSendingData.value = false
    }

    if (audioRecorder.isRecording.value) {
      audioRecorder.stop().catch(() => {
        // Ignore errors
      })
    }

    if (sdk.isConnected.value) {
      sdk.disconnect().catch(() => {
        // Ignore errors
      })
    }

    sdk.unloadCharacter()
    
    // Reset state
    isLoading.value = false
    conversationState.value = null
    shouldContinueSendingData.value = false
    
    logger.updateStatus('Character unloaded', 'info')
    logger.log('info', 'Character unloaded, can reload new character')
  } catch (error) {
    logger.log('error', `Unload character failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isProcessing.value.unload = false
  }
}

// 监听全局 SDK 初始化状态
watch(() => props.globalSDKInitialized, (initialized) => {
  if (initialized) {
    logger.updateStatus('SDK initialized, ready to load character', 'success')
  } else {
    logger.updateStatus('Waiting for initialization...', 'info')
  }
}, { immediate: true })

// Event handlers
const handleCharacterIdChange = (id: string) => {
  characterId.value = id
  if (id && !characterIdList.value.includes(id)) {
    characterIdList.value.push(id)
  }
}

// Cleanup on component unmount
onUnmounted(() => {
  // Stop recording if active (demo state management)
  if (audioRecorder.isRecording.value) {
    audioRecorder.stop().catch(() => {
      // Ignore errors
    })
  }

  // Unload character - SDK will handle disconnect and other cleanup automatically
  if (sdk.avatarView.value) {
    sdk.unloadCharacter()
  }

  // Cleanup audio recorder (demo state management)
  audioRecorder.cleanup()
})
</script>

<style scoped>
.avatar-panel {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 500px;
  max-height: 600px;
}

.avatar-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.avatar-panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.btn-remove {
  width: auto;
  padding: 4px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  margin: 0;
  transition: background 0.2s;
}

.btn-remove:hover {
  background: #dc2626;
}

.avatar-panel-content {
  display: flex;
  flex-direction: row;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.avatar-panel-controls {
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  max-height: 100%;
}

.avatar-panel-canvas {
  flex: 1;
  min-width: 0;
  min-height: 400px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1024px) {
  .avatar-panel-content {
    flex-direction: column;
  }
  
  .avatar-panel-controls {
    width: 100%;
    min-width: auto;
    max-height: 400px;
  }
  
  .avatar-panel-canvas {
    min-height: 400px;
  }
  
  .log-drawer {
    width: 100%;
    right: -100%;
  }
  
  .log-drawer.open {
    right: 0;
  }
}

/* Log Drawer */
.log-drawer {
  position: fixed;
  top: 0;
  right: -450px;
  width: 450px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transition: right 0.3s ease;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e5e7eb;
}

.log-drawer.open {
  right: 0;
}

.log-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.log-drawer-header h2 {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.btn-close-drawer {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  color: #6b7280;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-drawer:hover {
  background: #e5e7eb;
  color: #333;
}
</style>

