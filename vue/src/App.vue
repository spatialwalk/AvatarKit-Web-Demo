<template>
  <div class="container">
    <div class="header">
      <h1>🚀 SPAvatar SDK - Vue Example</h1>
      <p>Integrate SDK using Vue 3 Composition API</p>
    </div>

    <div class="content">
      <div class="left-panel">
        <AvatarCanvas ref="avatarCanvasRef" />
      </div>
      <div class="right-panel">
        <StatusBar :message="logger.statusMessage.value" :type="logger.statusClass.value" />

        <ControlPanel
          :environment="environment"
          :character-id="characterId"
          :session-token="sessionToken"
          :playback-mode="playbackMode"
          :is-initialized="sdk.isInitialized.value"
          :avatar-view="sdk.avatarView.value"
          :avatar-controller="sdk.avatarController.value"
          :is-recording="audioRecorder.isRecording.value"
          :is-loading="isLoading"
          :is-connected="sdk.isConnected.value"
          :current-playback-mode="currentPlaybackMode"
          @environment-change="handleEnvironmentChange"
          @character-id-change="handleCharacterIdChange"
          @session-token-change="handleSessionTokenChange"
          @playback-mode-change="handlePlaybackModeChange"
          @init="handleInit"
          @load-character="handleLoadCharacter"
          @connect="handleConnect"
          @start-record="handleStartRecord"
          @stop-record="handleStopRecord"
          @interrupt="handleInterrupt"
          @disconnect="handleDisconnect"
          @unload-character="handleUnloadCharacter"
        />

        <div class="control-panel log-panel-container">
          <h2>📋 Logs</h2>
          <LogPanel :logs="logger.logs.value" @clear="logger.clearLogs" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, nextTick } from 'vue'
import { useAvatarSDK } from './composables/useAvatarSDK'
import { Environment } from './types'
import { AvatarPlaybackMode } from '@spatialwalk/avatarkit'
import { useLogger } from './composables/useLogger'
import { useAudioRecorder } from './composables/useAudioRecorder'
import { resampleAudioWithWebAudioAPI, convertToInt16PCM, convertToUint8Array } from './utils/audioUtils'
import StatusBar from './components/StatusBar.vue'
import ControlPanel from './components/ControlPanel.vue'
import LogPanel from './components/LogPanel.vue'
import AvatarCanvas from './components/AvatarCanvas.vue'

const AUDIO_SAMPLE_RATE = 16000

// Configuration state
const environment = ref<Environment>(Environment.test)
const characterId = ref('')
const sessionToken = ref('')
const playbackMode = ref<AvatarPlaybackMode>(AvatarPlaybackMode.network)
const isLoading = ref(false)
const currentPlaybackMode = ref<AvatarPlaybackMode>(AvatarPlaybackMode.network)

// Operation state flags to prevent repeated clicks
const isProcessing = ref({
  init: false,
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

// Initialize SDK
const handleInit = async () => {
  if (isProcessing.value.init || sdk.isInitialized.value) {
    return
  }

  try {
    isProcessing.value.init = true
    isLoading.value = true
    logger.updateStatus('Initializing SDK...', 'info')
    logger.log('info', 'Initializing SDK...')

    await sdk.initialize(environment.value, sessionToken.value || undefined)

    logger.updateStatus('SDK initialized successfully', 'success')
    logger.log('success', 'SDK initialized successfully')
  } catch (error) {
    logger.updateStatus(
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    )
    logger.log('error', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isLoading.value = false
    isProcessing.value.init = false
  }
}

// Load character
const handleLoadCharacter = async (mode: AvatarPlaybackMode) => {
  if (isProcessing.value.loadCharacter || sdk.avatarView.value) {
    return
  }

  if (!sdk.isInitialized.value || !characterId.value.trim()) {
    logger.updateStatus('Please initialize SDK and enter character ID', 'warning')
    return
  }

  const canvasContainer = avatarCanvasRef.value?.canvasContainerRef
  if (!canvasContainer) {
    logger.updateStatus('Canvas container not found', 'error')
    return
  }

  try {
    isProcessing.value.loadCharacter = true
    isLoading.value = true
    currentPlaybackMode.value = mode
    logger.updateStatus(`Loading character (${mode === AvatarPlaybackMode.network ? 'network' : 'external'} mode)...`, 'info')
    logger.log('info', `Starting to load character: ${characterId.value} (mode: ${mode === AvatarPlaybackMode.network ? 'network' : 'external'})`)

    await sdk.loadCharacter(
      characterId.value,
      canvasContainer,
      mode,
      {
        onConnectionState: (state) => {
          logger.log('info', `Connection state: ${state}`)
          if (state === 'connected') {
            logger.updateStatus('Connected', 'success')
          } else if (state === 'disconnected') {
            logger.updateStatus('Disconnected', 'info')
          }
        },
        onAvatarState: (state) => {
          logger.log('info', `Avatar state: ${state}`)
        },
        onError: (error: Error) => {
          logger.log('error', `Error: ${error.message}`)
          logger.updateStatus(`Error: ${error.message}`, 'error')
        },
      },
    )

    logger.updateStatus('Character loaded successfully', 'success')
    logger.log('success', 'Character loaded successfully')
    
    // Use nextTick to ensure avatarView state is updated before clearing isLoading
    // This prevents the Connect button from flickering
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

  if (currentPlaybackMode.value !== AvatarPlaybackMode.network) {
    logger.updateStatus('Connect is only available in network mode', 'warning')
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

  if (currentPlaybackMode.value !== AvatarPlaybackMode.network) {
    logger.updateStatus('Recording is only available in network mode', 'warning')
    return
  }
  
  if (!sdk.avatarController.value || !sdk.isConnected.value) {
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
    // Clear processing flag immediately after starting recording; recording itself is a long-running state
    isProcessing.value.startRecord = false
  }
}

// Stop recording / Play external data
const handleStopRecord = async () => {
  if (isProcessing.value.stopRecord) {
    return
  }

  if (currentPlaybackMode.value === AvatarPlaybackMode.network) {
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
    
    if (currentPlaybackMode.value === AvatarPlaybackMode.network) {
      // Network mode: stop recording and send audio (fast operation, no need to use isLoading)
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
      // External data mode: load and play data from files
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
  // If already playing, interrupt first so we can replay safely
  if (sdk.avatarView.value?.controller) {
    try {
      sdk.interrupt()
      // Wait briefly for the interrupt to take effect
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (e) {
      // Ignore errors if interrupt fails (may already be stopped)
    }
  }

  try {
    // Only set isLoading while loading files
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
    
    // Load audio file (24kHz PCM16, need to resample to 16kHz)
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
    
    // Resample from 24kHz to 16kHz using Web Audio API
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
    
    // After files are loaded, clear isLoading and start streaming data asynchronously (non-blocking)
    isLoading.value = false
    logger.updateStatus('Playing external data...', 'info')
    
    // Calculate send rate: at least 2x playback speed
    const playbackRateBytesPerSecond = AUDIO_SAMPLE_RATE * 2 * 2
    const sendInterval = 50 // 50ms per send
    const bytesPerInterval = Math.floor(playbackRateBytesPerSecond * sendInterval / 1000)
    
    // Prepare initial data (at least 1 second)
    const initialDataSize = playbackRateBytesPerSecond
    const initialAudioChunks: Array<{ data: Uint8Array; isLast: boolean }> = []
    let audioOffset = 0
    
    while (audioOffset < initialDataSize && audioOffset < audioData.length) {
      const chunkEnd = Math.min(audioOffset + bytesPerInterval, audioData.length, initialDataSize)
      const chunk = audioData.slice(audioOffset, chunkEnd)
      const isLast = chunkEnd >= audioData.length && chunkEnd >= initialDataSize
      initialAudioChunks.push({ data: chunk, isLast })
      audioOffset = chunkEnd
    }
    
    // Prepare initial keyframes (about 1 second at 30fps)
    const initialKeyframes = keyframes.slice(0, Math.min(30, keyframes.length))
    
    // Start playback with initial data
    await sdk.play(initialAudioChunks, initialKeyframes)
    
    // Continue sending remaining audio data (at 2x speed) asynchronously
    // Use Promise without awaiting so buttons remain responsive
    Promise.resolve().then(async () => {
      while (audioOffset < audioData.length) {
        const chunkEnd = Math.min(audioOffset + bytesPerInterval, audioData.length)
        const chunk = audioData.slice(audioOffset, chunkEnd)
        const isLast = chunkEnd >= audioData.length
        
        sdk.sendAudioChunk(chunk, isLast)
        audioOffset = chunkEnd
        
        await new Promise(resolve => setTimeout(resolve, sendInterval))
      }
      
      // Send remaining keyframes
      if (keyframes.length > initialKeyframes.length) {
        const remainingKeyframes = keyframes.slice(initialKeyframes.length)
        sdk.sendKeyframes(remainingKeyframes)
      }
      
      logger.log('success', `External data mode: all data sent (${audioData.length} bytes audio, ${keyframes.length} keyframes)`)
    })
    
    logger.updateStatus('External data playback started', 'success')
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

  if (currentPlaybackMode.value !== AvatarPlaybackMode.network) {
    logger.updateStatus('Disconnect is only available in network mode', 'warning')
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
    // Don't set isLoading - unload is synchronous and fast
    // Setting isLoading would cause other buttons (Connect, Record, etc.) to flicker unnecessarily

    // If recording, stop first
    if (audioRecorder.isRecording.value) {
      audioRecorder.stop().catch(() => {
        // Ignore errors when stopping recording
      })
    }

    // If connected, disconnect first
    if (sdk.isConnected.value) {
      sdk.disconnect().catch(() => {
        // Ignore errors when disconnecting
      })
    }

    sdk.unloadCharacter()
    logger.updateStatus('Character unloaded', 'info')
    logger.log('info', 'Character unloaded, can reload new character')
  } catch (error) {
    logger.log('error', `Unload character failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isProcessing.value.unload = false
  }
}

// Event handlers
const handleEnvironmentChange = (env: Environment) => {
  environment.value = env
}

const handleCharacterIdChange = (id: string) => {
  characterId.value = id
}

const handleSessionTokenChange = (token: string) => {
  sessionToken.value = token
}

const handlePlaybackModeChange = (mode: AvatarPlaybackMode) => {
  playbackMode.value = mode
}

// Cleanup on component unmount
onUnmounted(() => {
  audioRecorder.cleanup()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}
</style>

<style scoped>

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  text-align: center;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.header p {
  opacity: 0.9;
  font-size: 14px;
}

.content {
  display: flex;
  gap: 24px;
  padding: 24px;
  height: calc(100vh - 200px);
  min-height: 600px;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.right-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .content {
    flex-direction: column;
    height: auto;
  }
  
  .right-panel {
    width: 100%;
  }
  
  .canvas-container {
    max-height: 50vh;
  }
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
