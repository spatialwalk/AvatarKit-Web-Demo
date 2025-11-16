/**
 * Avatar SDK Composable
 * Encapsulates SDK initialization and usage logic
 */

import { ref, onUnmounted } from 'vue'
import { AvatarKit, AvatarManager, AvatarView, Environment, AvatarPlaybackMode, type AvatarController, type ConnectionState, type AvatarState } from '@spatialwalk/avatarkit'

export function useAvatarSDK() {
  const isInitialized = ref(false)
  const isConnected = ref(false)
  const avatarManagerRef = ref<AvatarManager | null>(null)
  const avatarViewRef = ref<AvatarView | null>(null)
  const avatarController = ref<AvatarController | null>(null)

  // Initialize SDK
  const initialize = async (environment: Environment, sessionToken?: string) => {
    try {
      await AvatarKit.initialize('demo', { environment })
      
      if (sessionToken) {
        AvatarKit.setSessionToken(sessionToken)
      }

      const avatarManager = new AvatarManager()
      avatarManagerRef.value = avatarManager
      isInitialized.value = true
    } catch (error) {
      throw new Error(`SDK initialization failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Load character
  const loadCharacter = async (
    characterId: string,
    container: HTMLElement,
    playbackMode: AvatarPlaybackMode = AvatarPlaybackMode.network,
    callbacks?: {
      onConnectionState?: (state: ConnectionState) => void
      onAvatarState?: (state: AvatarState) => void
      onError?: (error: Error) => void
    },
  ) => {
    if (!avatarManagerRef.value) {
      throw new Error('SDK not initialized')
    }

    try {
      // 1. Load Avatar
      const avatar = await avatarManagerRef.value.load(characterId)
      
      // 2. Create AvatarView with new API
      const avatarView = new AvatarView(avatar, {
        container,
        playbackMode,
      })
      
      // 3. Set callbacks (use controller instead of avatarController)
      avatarView.controller.onConnectionState = (state: ConnectionState) => {
        isConnected.value = state === 'connected'
        callbacks?.onConnectionState?.(state)
      }
      if (callbacks?.onAvatarState) {
        avatarView.controller.onAvatarState = callbacks.onAvatarState
      }
      if (callbacks?.onError) {
        avatarView.controller.onError = callbacks.onError
      }
      
      // Reset connection state on character load
      isConnected.value = false

      avatarViewRef.value = avatarView
      avatarController.value = avatarView.controller
    } catch (error) {
      throw new Error(`Failed to load character: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Connect service (network mode only)
  const connect = async () => {
    if (!avatarViewRef.value?.controller) {
      throw new Error('Character not loaded')
    }

    await avatarViewRef.value.controller.start()
  }

  // Send audio data (network mode only)
  const sendAudio = (audioData: ArrayBuffer, isFinal: boolean = false) => {
    if (!avatarController.value) {
      throw new Error('Character not loaded or not connected')
    }
    if (!avatarController.value.send) {
      throw new Error('send() is only available in network mode')
    }
    avatarController.value.send(audioData, isFinal)
  }

  // Play (external data mode)
  const play = async (
    initialAudioChunks?: Array<{ data: Uint8Array, isLast: boolean }>,
    initialKeyframes?: any[],
  ) => {
    if (!avatarController.value) {
      throw new Error('Character not loaded')
    }
    if (!avatarController.value.play) {
      throw new Error('play() is only available in external data mode')
    }
    await avatarController.value.play(initialAudioChunks, initialKeyframes)
  }

  // Send audio chunk (external data mode)
  const sendAudioChunk = (data: Uint8Array, isLast: boolean = false) => {
    if (!avatarController.value) {
      throw new Error('Character not loaded')
    }
    if (!avatarController.value.sendAudioChunk) {
      throw new Error('sendAudioChunk() is only available in external data mode')
    }
    avatarController.value.sendAudioChunk(data, isLast)
  }

  // Send keyframes (external data mode)
  const sendKeyframes = (keyframes: any[]) => {
    if (!avatarController.value) {
      throw new Error('Character not loaded')
    }
    if (!avatarController.value.sendKeyframes) {
      throw new Error('sendKeyframes() is only available in external data mode')
    }
    avatarController.value.sendKeyframes(keyframes)
  }

  // Interrupt conversation
  const interrupt = () => {
    if (!avatarController.value) {
      throw new Error('Character not loaded or not connected')
    }
    avatarController.value.interrupt()
  }

  // Disconnect (network mode only)
  const disconnect = async () => {
    if (avatarViewRef.value?.controller) {
      avatarViewRef.value.controller.close()
      isConnected.value = false
      // Don't clear avatarView and avatarController when disconnecting, allow reconnection
    }
  }

  // Unload character
  // ⚠️ Important: SDK currently only supports one character at a time. If you want to load a new character, you must unload the current one first
  const unloadCharacter = () => {
    if (avatarViewRef.value) {
      avatarViewRef.value.dispose() // Clean up all resources, including closing connection, releasing WASM resources, removing Canvas, etc.
      avatarViewRef.value = null
      avatarController.value = null
      isConnected.value = false
    }
  }

  // Cleanup resources
  onUnmounted(() => {
    if (avatarViewRef.value) {
      avatarViewRef.value.dispose()
      avatarViewRef.value = null
      avatarController.value = null
    }
    if (avatarManagerRef.value) {
      avatarManagerRef.value = null
    }
  })

  return {
    isInitialized,
    isConnected,
    avatarView: avatarViewRef,
    avatarController,
    initialize,
    loadCharacter,
    connect,
    sendAudio,
    play,
    sendAudioChunk,
    sendKeyframes,
    interrupt,
    disconnect,
    unloadCharacter,
  }
}

