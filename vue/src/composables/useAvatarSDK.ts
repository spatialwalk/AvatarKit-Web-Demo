/**
 * Avatar SDK Composable
 * Encapsulates SDK initialization and usage logic
 */

import { ref, onUnmounted } from 'vue'
import { AvatarSDK, AvatarManager, AvatarView, Environment, DrivingServiceMode, type AvatarController, type ConnectionState, type ConversationState } from '@spatialwalk/avatarkit'

export function useAvatarSDK() {
  const isConnected = ref(false)
  const avatarManagerRef = ref<AvatarManager | null>(null)
  const avatarViewRef = ref<AvatarView | null>(null)
  const avatarController = ref<AvatarController | null>(null)

  // 获取 AvatarManager（延迟初始化）
  const getAvatarManager = () => {
    if (!avatarManagerRef.value && AvatarSDK.isInitialized) {
      avatarManagerRef.value = AvatarManager.shared
    }
    return avatarManagerRef.value
  }

  // Initialize SDK (保留用于向后兼容，但建议使用全局初始化)
  const initialize = async (environment: Environment, drivingServiceMode: DrivingServiceMode = DrivingServiceMode.sdk, sessionToken?: string) => {
    try {
      await AvatarSDK.initialize('app_mj8526em_9fpt9s', { 
        environment,
        drivingServiceMode 
      })
      
      if (sessionToken) {
        AvatarSDK.setSessionToken(sessionToken)
      }

      avatarManagerRef.value = AvatarManager.shared
    } catch (error) {
      throw new Error(`SDK initialization failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Load avatar
  const loadAvatar = async (
    avatarId: string,
    container: HTMLElement,
    callbacks?: {
      onConnectionState?: (state: ConnectionState) => void
      onConversationState?: (state: ConversationState) => void
      onError?: (error: Error) => void
    },
  ) => {
    const avatarManager = getAvatarManager()
    if (!avatarManager) {
      throw new Error('SDK not initialized')
    }

    try {
      // 1. Load Avatar
      const avatar = await avatarManager.load(avatarId)
      
      // 2. Validate container is a valid HTMLElement
      if (!container || !(container instanceof HTMLElement)) {
        throw new Error(`Invalid container: expected HTMLElement, got ${typeof container}`)
      }
      
      // 3. Create AvatarView (playback mode is determined by drivingServiceMode in AvatarSDK.initialize())
      const avatarView = new AvatarView(avatar, container)
      
      // 4. Set callbacks (use controller instead of avatarController)
      avatarView.controller.onConnectionState = (state: ConnectionState) => {
        isConnected.value = state === 'connected'
        callbacks?.onConnectionState?.(state)
      }
      if (callbacks?.onConversationState) {
        avatarView.controller.onConversationState = callbacks.onConversationState
      }
      if (callbacks?.onError) {
        avatarView.controller.onError = callbacks.onError
      }
      
      // Reset connection state on avatar load
      isConnected.value = false

      avatarViewRef.value = avatarView
      avatarController.value = avatarView.controller
    } catch (error) {
      throw new Error(`Failed to load avatar: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Initialize audio context (MUST be called in user gesture context)
  const initializeAudioContext = async () => {
    if (!avatarViewRef.value?.controller) {
      throw new Error('Avatar not loaded')
    }
    
    const controller = avatarViewRef.value.controller as any
    if (typeof controller.initializeAudioContext !== 'function') {
      throw new Error('initializeAudioContext() is not available')
    }
    
    await controller.initializeAudioContext()
  }

  // Connect service (network mode only)
  const connect = async () => {
    if (!avatarViewRef.value?.controller) {
      throw new Error('Avatar not loaded')
    }

    // ⚠️ CRITICAL: Initialize audio context first (MUST be called in user gesture context)
    await initializeAudioContext()

    await avatarViewRef.value.controller.start()
  }

  // Send audio data (network mode only)
  const sendAudio = (audioData: ArrayBuffer, isFinal: boolean = false) => {
    if (!avatarController.value) {
      throw new Error('Avatar not loaded or not connected')
    }
    if (!avatarController.value.send) {
      throw new Error('send() is only available in network mode')
    }
    avatarController.value.send(audioData, isFinal)
  }

  // Yield audio data (host mode) - Streams audio data and returns conversationId
  const yieldAudioData = (data: Uint8Array, isLast: boolean = false): string | null => {
    if (!avatarController.value) {
      throw new Error('Avatar not loaded')
    }
    if (!avatarController.value.yieldAudioData) {
      throw new Error('yieldAudioData() is only available in host mode')
    }
    return avatarController.value.yieldAudioData(data, isLast)
  }

  // Yield frames data (host mode) - Streams animation keyframes with conversationId
  const yieldFramesData = (keyframes: any[], conversationId: string | null) => {
    if (!avatarController.value) {
      throw new Error('Avatar not loaded')
    }
    if (!avatarController.value.yieldFramesData) {
      throw new Error('yieldFramesData() is only available in host mode')
    }
    if (!conversationId) {
      throw new Error('conversationId is required for yieldFramesData()')
    }
    avatarController.value.yieldFramesData(keyframes, conversationId)
  }

  // Get current conversation ID
  const getCurrentConversationId = (): string | null => {
    if (!avatarController.value) {
      return null
    }
    const controller = avatarController.value as any
    if (typeof controller.getCurrentConversationId === 'function') {
      return controller.getCurrentConversationId()
    }
    return null
  }

  // Interrupt conversation
  const interrupt = () => {
    if (!avatarController.value) {
      throw new Error('Avatar not loaded or not connected')
    }
    avatarController.value.interrupt()
  }

  // Pause playback
  const pause = () => {
    if (!avatarController.value) {
      throw new Error('Avatar not loaded')
    }
    avatarController.value.pause()
  }

  // Resume playback
  const resume = async () => {
    if (!avatarController.value) {
      throw new Error('Avatar not loaded')
    }
    await avatarController.value.resume()
  }

  // Disconnect (network mode only)
  const disconnect = async () => {
    if (avatarViewRef.value?.controller) {
      avatarViewRef.value.controller.close()
      isConnected.value = false
      // Don't clear avatarView and avatarController when disconnecting, allow reconnection
    }
  }

  // Set audio volume
  const setVolume = (volume: number) => {
    if (!avatarController.value) {
      throw new Error('Avatar not loaded')
    }
    if (typeof volume !== 'number' || volume < 0 || volume > 1) {
      throw new Error('Volume must be a number between 0.0 and 1.0')
    }
    avatarController.value.setVolume(volume)
  }

  // Get current audio volume
  const getVolume = (): number => {
    if (!avatarController.value) {
      throw new Error('Avatar not loaded')
    }
    return avatarController.value.getVolume()
  }

  // Unload avatar
  // ⚠️ Important: SDK currently only supports one avatar at a time. If you want to load a new avatar, you must unload the current one first
  const unloadAvatar = () => {
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
    isConnected,
    avatarView: avatarViewRef,
    avatarController,
    initialize,
    loadAvatar,
    connect,
    initializeAudioContext,
    sendAudio,
    yieldAudioData,
    yieldFramesData,
    getCurrentConversationId,
    interrupt,
    pause,
    resume,
    disconnect,
    unloadAvatar,
    setVolume,
    getVolume,
  }
}

