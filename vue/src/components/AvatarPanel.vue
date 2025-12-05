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
          :environment="AvatarKit.configuration?.environment || Environment.test"
          :character-id="characterId"
          :character-id-list="characterIdList"
          :is-initialized="globalSDKInitialized"
          :avatar-view="sdk.avatarView.value"
          :avatar-controller="sdk.avatarController.value"
          :is-recording="audioRecorder.isRecording.value"
          :is-loading="isLoading"
          :is-connected="sdk.isConnected.value"
          :current-playback-mode="(AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk) === DrivingServiceMode.sdk ? 'network' : 'external'"
          @character-id-change="handleCharacterIdChange"
          @load-character="handleLoadCharacter"
          @connect="handleConnect"
          @start-record="handleStartRecord"
          @stop-record="handleStopRecord"
          @interrupt="handleInterrupt"
          @disconnect="handleDisconnect"
          @unload-character="handleUnloadCharacter"
          :conversation-state="conversationState"
          :volume="volume"
          @volume-change="(v) => {
            volume = v
            try {
              sdk.setVolume(v / 100)
            } catch (error) {
              logger.updateStatus(`Volume change failed: ${error instanceof Error ? error.message : String(error)}`, 'error')
            }
          }"
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
        <AvatarCanvas ref="avatarCanvasRef" :avatarView="(sdk.avatarView.value as any) ?? null" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, nextTick, watch } from 'vue'
import { useAvatarSDK } from '../composables/useAvatarSDK'
import { Environment } from '../types'
import { AvatarKit, DrivingServiceMode, ConversationState } from '@spatialwalk/avatarkit'
import { useLogger } from '../composables/useLogger'
import { useAudioRecorder } from '../composables/useAudioRecorder'
import { resampleAudioWithWebAudioAPI, convertToInt16PCM, convertToUint8Array } from '../utils/audioUtils'
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
const characterIdList = ref([
  'b7ba14f6-f9aa-4f89-9934-3753d75aee39',
  '35692117-ece1-4f77-b014-02cfa22bfb7b'
])
const characterId = ref('b7ba14f6-f9aa-4f89-9934-3753d75aee39')
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
    const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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

  const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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

  const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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

      const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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
    
      const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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
  // Stop any ongoing data sending first
  if (shouldContinueSendingData.value) {
    shouldContinueSendingData.value = false
    // Wait a bit to ensure the previous sending loop has stopped
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  if (sdk.avatarView.value?.controller) {
    try {
      sdk.interrupt()
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (e) {
      // Ignore errors
    }
  }

  shouldContinueSendingData.value = true

  try {
    isLoading.value = true
    logger.updateStatus('Loading external data...', 'info')
    
    const dataDir = `/src/data/${characterId.value}`
    
    const fileMap: Record<string, { audio: string; flame: string }> = {
      '35692117-ece1-4f77-b014-02cfa22bfb7b': {
        audio: 'audio_20251114042834_pHhATY2emf0w_1763065720879.pcm',
        flame: 'flame_20251114042841_veGlAmGfiEZ2_1763065740224.json',
      },
      'b7ba14f6-f9aa-4f89-9934-3753d75aee39': {
        audio: 'audio_20251113162847_qyozNRfGKI5C_1763022543772.pcm',
        flame: 'flame_20251113162847_qyozNRfGKI5C_1763022545208.json',
      },
    }
    
    const files = fileMap[characterId.value]
    if (!files) {
      throw new Error(`No data files configured for character ${characterId.value}`)
    }
    
    // Load audio file
    const audioFile = `${dataDir}/${files.audio}`
    const audioResponse = await fetch(audioFile)
    if (!audioResponse.ok) {
      throw new Error(`Failed to load audio file: ${audioResponse.status}`)
    }
    const audioArrayBuffer = await audioResponse.arrayBuffer()
    const rawAudioData = new Uint8Array(audioArrayBuffer)
    
    // Convert PCM16 (24kHz) to Float32Array
    const int16Data = new Int16Array(rawAudioData.buffer, rawAudioData.byteOffset, rawAudioData.length / 2)
    const float32Data = new Float32Array(int16Data.length)
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0
    }
    
    // Resample from 24kHz to 16kHz
    const resampledFloat32 = await resampleAudioWithWebAudioAPI(float32Data, 24000, AUDIO_SAMPLE_RATE)
    const resampledInt16 = convertToInt16PCM(resampledFloat32)
    const audioData = convertToUint8Array(resampledInt16)
    
    // Load animation file
    const flameFile = `${dataDir}/${files.flame}`
    const flameResponse = await fetch(flameFile)
    if (!flameResponse.ok) {
      throw new Error(`Failed to load animation file: ${flameResponse.status}`)
    }
    const json = await flameResponse.json()
    const keyframes = json.keyframes || []
    
    if (!keyframes || keyframes.length === 0) {
      throw new Error(`No keyframes found in animation file for character ${characterId.value}`)
    }
    
    isLoading.value = false
    logger.updateStatus('Playing external data...', 'info')
    
    const playbackRateBytesPerSecond = AUDIO_SAMPLE_RATE * 2 * 2
      const sendInterval = 30
    const bytesPerInterval = Math.floor(playbackRateBytesPerSecond * sendInterval / 1000)
    
      // Normal streaming flow: send audio first to get conversationId, then send animation data
    let audioOffset = 0
      let conversationId: string | null = null
      
      // Step 1: Send initial audio chunk to get conversationId
      const initialChunkSize = Math.min(bytesPerInterval, audioData.length)
      const initialChunk = audioData.slice(0, initialChunkSize)
      audioOffset = initialChunkSize
      
      conversationId = sdk.yieldAudioData(initialChunk, false)
      if (!conversationId) {
        throw new Error('Failed to get conversationId from initial audio data')
      }
      logger.log('info', `Got conversationId: ${conversationId}`)
      
      // Step 2: Stream audio and corresponding keyframes together in sync
      Promise.resolve().then(async () => {
        let keyframeIndex = 0
        // 假设每秒30帧，计算每个音频块（30ms）对应的帧数
        const keyframesPerSecond = 30
        const framesPerChunk = Math.ceil(keyframesPerSecond * sendInterval / 1000) // 每个音频块约1帧
        
      while (audioOffset < audioData.length && shouldContinueSendingData.value) {
        const chunkEnd = Math.min(audioOffset + bytesPerInterval, audioData.length)
        const chunk = audioData.slice(audioOffset, chunkEnd)
        const isLast = chunkEnd >= audioData.length
        
        if (!shouldContinueSendingData.value) {
          break
        }
        
          // Send audio chunk
          const currentConversationId = sdk.yieldAudioData(chunk, isLast)
          if (currentConversationId) {
            conversationId = currentConversationId
          }
          
          // Immediately send corresponding keyframes for this audio chunk
          if (conversationId && keyframeIndex < keyframes.length) {
            const endIndex = Math.min(keyframeIndex + framesPerChunk, keyframes.length)
            const framesToSend = keyframes.slice(keyframeIndex, endIndex)
            if (framesToSend.length > 0) {
              sdk.yieldFramesData(framesToSend, conversationId)
              keyframeIndex = endIndex
            }
          }
          
        audioOffset = chunkEnd
        await new Promise(resolve => setTimeout(resolve, sendInterval))
      }
      
        // Send any remaining keyframes if audio finished but keyframes remain
        if (shouldContinueSendingData.value && keyframeIndex < keyframes.length && conversationId) {
          const remainingKeyframes = keyframes.slice(keyframeIndex)
          if (remainingKeyframes.length > 0) {
            sdk.yieldFramesData(remainingKeyframes, conversationId)
          }
      }
      
      if (shouldContinueSendingData.value) {
          logger.log('success', `Host mode: all data sent (${audioData.length} bytes audio, ${keyframes.length} keyframes)`)
      }
    })
    
      logger.updateStatus('Host mode playback started', 'success')
  } catch (error) {
    isLoading.value = false
    throw new Error(`External data mode failed: ${error instanceof Error ? error.message : String(error)}`)
  }
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
    
      const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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

    const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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
      const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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

