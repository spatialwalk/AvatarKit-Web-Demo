<template>
  <div class="container">
    <div class="header">
      <h1>🚀 SPAvatar SDK - Vue Example</h1>
      <p>Integrate SDK using Vue 3 Composition API</p>
    </div>

    <div class="content">
      <StatusBar :message="logger.statusMessage.value" :type="logger.statusClass.value" />

      <ControlPanel
        :environment="environment"
        :character-id="characterId"
        :session-token="sessionToken"
        :is-initialized="sdk.isInitialized.value"
        :avatar-view="sdk.avatarView.value"
        :avatar-controller="sdk.avatarController.value"
        :is-recording="audioRecorder.isRecording.value"
        :is-loading="isLoading"
        @environment-change="handleEnvironmentChange"
        @character-id-change="handleCharacterIdChange"
        @session-token-change="handleSessionTokenChange"
        @init="handleInit"
        @load-character="handleLoadCharacter"
        @connect="handleConnect"
        @start-record="handleStartRecord"
        @stop-record="handleStopRecord"
        @interrupt="handleInterrupt"
        @disconnect="handleDisconnect"
        @unload-character="handleUnloadCharacter"
      />

      <AvatarCanvas ref="avatarCanvasRef" />

      <LogPanel :logs="logger.logs.value" @clear="logger.clearLogs" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useAvatarSDK } from './composables/useAvatarSDK'
import { Environment } from './types'
import { useLogger } from './composables/useLogger'
import { useAudioRecorder } from './composables/useAudioRecorder'
import StatusBar from './components/StatusBar.vue'
import ControlPanel from './components/ControlPanel.vue'
import LogPanel from './components/LogPanel.vue'
import AvatarCanvas from './components/AvatarCanvas.vue'

// Configuration state
const environment = ref<Environment>(Environment.test)
const characterId = ref('')
const sessionToken = ref('')
const isLoading = ref(false)

// Composables
const logger = useLogger()
const audioRecorder = useAudioRecorder()
const sdk = useAvatarSDK()

// Refs
const avatarCanvasRef = ref<InstanceType<typeof AvatarCanvas> | null>(null)

// Initialize SDK
const handleInit = async () => {
  try {
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
  }
}

// Load character
const handleLoadCharacter = async () => {
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
    isLoading.value = true
    logger.updateStatus('Loading character...', 'info')
    logger.log('info', `Starting to load character: ${characterId.value}`)

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
  } catch (error) {
    logger.updateStatus(
      `Load failed: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    )
    logger.log('error', `Load failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isLoading.value = false
  }
}

// Connect service
const handleConnect = async () => {
  try {
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
  }
}

// Start recording
const handleStartRecord = async () => {
  if (!sdk.avatarController.value) {
    logger.updateStatus('Please connect to service first', 'warning')
    return
  }

  try {
    isLoading.value = true
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
  } finally {
    isLoading.value = false
  }
}

// Stop recording
const handleStopRecord = async () => {
  try {
    isLoading.value = true
    const audioBuffer = await audioRecorder.stop()

    if (audioBuffer && sdk.avatarController.value) {
      const duration = (audioBuffer.byteLength / 2 / 16000).toFixed(2)
      logger.log('info', `Recording completed, total length: ${audioBuffer.byteLength} bytes (${duration}s, 16kHz PCM16)`)
      sdk.sendAudio(audioBuffer, true)
      logger.log('success', 'Complete audio data sent')
    } else if (!audioBuffer) {
      logger.log('warning', 'No audio data collected')
    }

    logger.updateStatus('Recording stopped', 'info')
    logger.log('success', 'Recording stopped')
  } catch (error) {
    logger.log('error', `Stop recording failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isLoading.value = false
  }
}

// Interrupt conversation
const handleInterrupt = () => {
  try {
    sdk.interrupt()
    logger.updateStatus('Current conversation interrupted', 'info')
    logger.log('info', 'Current conversation interrupted')
  } catch (error) {
    logger.updateStatus(
      `Interrupt failed: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    )
    logger.log('error', `Interrupt failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Disconnect
const handleDisconnect = async () => {
  try {
    if (audioRecorder.isRecording.value) {
    await handleStopRecord()
  }
  
    await sdk.disconnect()
    logger.updateStatus('Disconnected', 'info')
    logger.log('info', 'Disconnected')
  } catch (error) {
    logger.log('error', `Disconnect failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Unload character
const handleUnloadCharacter = () => {
  try {
    sdk.unloadCharacter()
    logger.updateStatus('Character unloaded', 'info')
    logger.log('info', 'Character unloaded, can reload new character')
  } catch (error) {
    logger.log('error', `Unload character failed: ${error instanceof Error ? error.message : String(error)}`)
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

// Cleanup on component unmount
onUnmounted(() => {
  audioRecorder.cleanup()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0 0 10px 0;
  color: #333;
}

.header p {
  color: #666;
  margin: 0;
}
</style>
