/**
 * Avatar SDK Hook
 * Encapsulates SDK initialization and usage logic
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { AvatarKit, AvatarManager, AvatarView, Environment, DrivingServiceMode, type AvatarController, type ConnectionState, type ConversationState } from '@spatialwalk/avatarkit'

export function useAvatarSDK() {
  const [isConnected, setIsConnected] = useState(false)
  const [avatarView, setAvatarView] = useState<AvatarView | null>(null)
  const [avatarController, setAvatarController] = useState<AvatarController | null>(null)
  const avatarManagerRef = useRef<AvatarManager | null>(null)
  const avatarViewRef = useRef<AvatarView | null>(null)

  // 获取 AvatarManager（延迟初始化）
  const getAvatarManager = () => {
    if (!avatarManagerRef.current && AvatarKit.isInitialized) {
      avatarManagerRef.current = AvatarManager.shared
    }
    return avatarManagerRef.current
  }

  // Initialize SDK (保留用于向后兼容，但建议使用全局初始化)
  const initialize = async (environment: Environment, drivingServiceMode: DrivingServiceMode = DrivingServiceMode.sdk, sessionToken?: string) => {
    try {
      await AvatarKit.initialize('demo', { 
        environment,
        drivingServiceMode 
      })
      
      if (sessionToken) {
        AvatarKit.setSessionToken(sessionToken)
      }

      avatarManagerRef.current = AvatarManager.shared
    } catch (error) {
      throw new Error(`SDK initialization failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Load character
  const loadCharacter = async (
    characterId: string,
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
      const avatar = await avatarManager.load(characterId)
      
      // 2. Validate container is a valid HTMLElement
      if (!container || !(container instanceof HTMLElement)) {
        throw new Error(`Invalid container: expected HTMLElement, got ${typeof container}`)
      }
      
      // 3. Create AvatarView (playback mode is determined by drivingServiceMode in AvatarKit.initialize())
      const avatarView = new AvatarView(avatar, container)
      
      // 4. Set callbacks (use controller instead of avatarController)
      // Reset connection state before attaching callback to avoid race conditions
      setIsConnected(false)
      avatarView.controller.onConnectionState = (state: ConnectionState) => {
        setIsConnected(state === 'connected')
        callbacks?.onConnectionState?.(state)
      }
      if (callbacks?.onConversationState) {
        avatarView.controller.onConversationState = callbacks.onConversationState
      }
      if (callbacks?.onError) {
        avatarView.controller.onError = callbacks.onError
      }

      setAvatarView(avatarView)
      avatarViewRef.current = avatarView
      setAvatarController(avatarView.controller)
    } catch (error) {
      throw new Error(`Failed to load character: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Connect service (network mode only)
  const connect = useCallback(async () => {
    if (!avatarView?.controller) {
      throw new Error('Character not loaded')
    }

    await avatarView.controller.start()
  }, [avatarView])

  // Send audio data (network mode only)
  const sendAudio = useCallback((audioData: ArrayBuffer, isFinal: boolean = false) => {
    if (!avatarController) {
      throw new Error('Character not loaded or not connected')
    }
    if (!avatarController.send) {
      throw new Error('send() is only available in network mode')
    }
    avatarController.send(audioData, isFinal)
  }, [avatarController])

  // Yield audio data (external data mode) - Streams audio data and returns conversationId
  const yieldAudioData = (data: Uint8Array, isLast: boolean = false): string | null => {
    if (!avatarController) {
      throw new Error('Character not loaded')
    }
    if (!avatarController.yieldAudioData) {
      throw new Error('yieldAudioData() is only available in host mode')
    }
    return avatarController.yieldAudioData(data, isLast)
  }

  // Yield frames data (external data mode) - Streams animation keyframes with conversationId
  const yieldFramesData = (keyframes: any[], conversationId: string | null) => {
    if (!avatarController) {
      throw new Error('Character not loaded')
    }
    if (!avatarController.yieldFramesData) {
      throw new Error('yieldFramesData() is only available in host mode')
    }
    if (!conversationId) {
      throw new Error('conversationId is required for yieldFramesData()')
    }
    avatarController.yieldFramesData(keyframes, conversationId)
  }

  // Get current conversation ID
  const getCurrentConversationId = useCallback((): string | null => {
    if (!avatarController) {
      return null
    }
    // Type assertion needed as TypeScript definitions may not be updated yet
    const controller = avatarController as any
    if (typeof controller.getCurrentConversationId === 'function') {
      return controller.getCurrentConversationId()
    }
    return null
  }, [avatarController])

  // Interrupt conversation
  const interrupt = useCallback(() => {
    if (!avatarController) {
      throw new Error('Character not loaded or not connected')
    }
    avatarController.interrupt()
  }, [avatarController])

  // Pause playback
  const pause = useCallback(() => {
    if (!avatarController) {
      throw new Error('Character not loaded')
    }
    avatarController.pause()
  }, [avatarController])

  // Resume playback
  const resume = useCallback(async () => {
    if (!avatarController) {
      throw new Error('Character not loaded')
    }
    await avatarController.resume()
  }, [avatarController])

  // Disconnect (network mode only)
  const disconnect = useCallback(async () => {
    if (avatarView?.controller) {
      avatarView.controller.close()
      setIsConnected(false)
      // Don't clear avatarView and avatarController when disconnecting, allow reconnection
    }
  }, [avatarView])

  // Set audio volume
  const setVolume = useCallback((volume: number) => {
    if (!avatarController) {
      throw new Error('Character not loaded')
    }
    if (typeof volume !== 'number' || volume < 0 || volume > 1) {
      throw new Error('Volume must be a number between 0.0 and 1.0')
    }
    avatarController.setVolume(volume)
  }, [avatarController])

  // Get current audio volume
  const getVolume = useCallback((): number => {
    if (!avatarController) {
      throw new Error('Character not loaded')
    }
    return avatarController.getVolume()
  }, [avatarController])

  // Unload character
  // ⚠️ Important: SDK currently only supports one character at a time. If you want to load a new character, you must unload the current one first
  const unloadCharacter = useCallback(() => {
    if (avatarView) {
      avatarView.dispose() // Clean up all resources, including closing connection, releasing WASM resources, removing Canvas, etc.
      setAvatarView(null)
      avatarViewRef.current = null
      setAvatarController(null)
      setIsConnected(false)
    }
  }, [avatarView])

  // Cleanup resources (only executed on component unmount)
  useEffect(() => {
    return () => {
      // Clean up all resources when component unmounts
      if (avatarViewRef.current) {
        avatarViewRef.current.dispose()
      }
      // Clear avatarManagerRef when component unmounts
      if (avatarManagerRef.current) {
        avatarManagerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array, only executed on component unmount

  return {
    isConnected,
    avatarView,
    avatarController,
    initialize,
    loadCharacter,
    connect,
    sendAudio,
    yieldAudioData,
    yieldFramesData,
    getCurrentConversationId,
    interrupt,
    pause,
    resume,
    disconnect,
    unloadCharacter,
    setVolume,
    getVolume,
  }
}

